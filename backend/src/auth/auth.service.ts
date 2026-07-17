import { Injectable, ConflictException, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Role } from '@prisma/client';
import { ResendService } from '../notifications/resend.service';
import { OAuth2Client } from 'google-auth-library';
import { signSession } from '../common/jwt.util';

// Login says the same thing whether the email is unknown or the password is wrong.
// Anything more specific turns the login form into a tool for discovering which
// email addresses have accounts here.
const BAD_CREDENTIALS = 'Email or password is incorrect.';

// A real bcrypt hash, compared against when no account matches, so that an unknown
// email costs the same ~100ms as a known one. Without it the response time itself
// answers "does this address have an account?". Computed once at startup.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-timing-equalizer', 10);

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private prisma: PrismaService,
    private resendService: ResendService,
  ) {}

  /**
   * Email verification and password reset tokens.
   *
   * These were `Math.random().toString(36)`, which is a seeded PRNG with no
   * cryptographic strength -- observing a couple of tokens can be enough to predict
   * the next, and predicting a reset token is a full account takeover. 32 bytes
   * from the CSPRNG instead.
   */
  private secureToken(): string {
    return randomBytes(32).toString('hex');
  }

  async register(data: { email: string; name: string; password: string; role?: Role }) {
    if (data.role === Role.ADMIN) {
      throw new ForbiddenException('Admin accounts can only be created by an existing administrator');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const verificationToken = this.secureToken();

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: data.role || Role.PUBLIC,
        // Organizers and volunteers both start unapproved: organizers need admin
        // clearance; volunteers must be assigned to an event by an organizer/admin.
        isApproved: data.role === Role.ORGANIZER || data.role === Role.VOLUNTEER ? false : true,
        emailVerified: false,
        profileComplete: false,
        verificationToken,
      },
    });

    // Send email using Resend
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const emailContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0b5cff; font-weight: 800; margin-bottom: 16px; font-size: 24px;">Welcome to IndraNetra</h2>
        <p style="font-size: 16px; color: #334155; line-height: 1.5;">Hi ${user.name},</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.5;">Thank you for registering on the IndraNetra AI-Powered Crowd Intelligence Platform.</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.5;">Please click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyLink}" style="display: inline-block; background-color: #0b5cff; color: white; padding: 12px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 15px;">Verify Email Address</a>
        </div>
        <p style="color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 20px;">If you did not sign up for this account, you can safely ignore this email.</p>
      </div>
    `;

    await this.resendService.sendEmail(
      user.email,
      'Verify your IndraNetra Account',
      emailContent
    );

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      email: user.email,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new ConflictException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    // If role is VOLUNTEER, create volunteer record if not exists
    if (user.role === Role.VOLUNTEER) {
      const existingVol = await this.prisma.volunteer.findUnique({ where: { userId: user.id } });
      if (!existingVol) {
        await this.prisma.volunteer.create({
          data: {
            userId: user.id,
            status: 'AVAILABLE',
          },
        });
      }
    }

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        volunteer: true,
        organizerProfile: true,
        publicUserProfile: true,
      }
    });

    if (!user) {
      // Hash anyway so a missing account and a wrong password take the same time.
      // Returning instantly here is a timing oracle that reveals which emails exist.
      await bcrypt.compare(data.password, DUMMY_HASH);
      throw new UnauthorizedException(BAD_CREDENTIALS);
    }

    const matches = await bcrypt.compare(data.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException(BAD_CREDENTIALS);
    }

    // These checks run only AFTER the password is proven correct. That order matters:
    // it means the account-state messages below are only ever shown to someone who
    // already holds the password, so they leak nothing to an attacker.
    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Please confirm your email address first. Check your inbox for the link we sent you.',
      );
    }

    if (user.role === Role.ORGANIZER && !user.isApproved) {
      throw new ForbiddenException(
        'Your organizer account is waiting for approval. We will email you when it is ready.',
      );
    }

    const token = this.generateToken(user);

    let profile: any = null;
    if (user.role === Role.VOLUNTEER) profile = user.volunteer;
    else if (user.role === Role.ORGANIZER) profile = user.organizerProfile;
    else if (user.role === Role.PUBLIC) profile = user.publicUserProfile;

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
        // Same field /auth/me returns, so the frontend routes new users to
        // /profile-setup straight after login/signup, not just on later page loads.
        needsProfileSetup: !user.profileComplete,
        profileComplete: user.profileComplete,
        profile,
      },
    };
  }

  async googleLogin(data: { idToken: string; role?: Role }) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: data.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const { email, name, picture: avatar } = payload;

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        volunteer: true,
        organizerProfile: true,
        publicUserProfile: true,
      }
    });

    if (!user) {
      if (data.role === Role.ADMIN) {
        throw new ForbiddenException('Admin accounts cannot be registered via public Google Sign-In');
      }

      const passwordHash = await bcrypt.hash(Math.random().toString(36), 10);
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || 'Google User',
          passwordHash,
          avatar: avatar || null,
          role: data.role || Role.PUBLIC,
          // Organizers and volunteers both start unapproved (see register()).
          isApproved: data.role === Role.ORGANIZER || data.role === Role.VOLUNTEER ? false : true,
          emailVerified: true, // Google accounts are verified
          profileComplete: false,
        },
        include: {
          volunteer: true,
          organizerProfile: true,
          publicUserProfile: true,
        }
      });

      if (user.role === Role.VOLUNTEER) {
        await this.prisma.volunteer.create({
          data: {
            userId: user.id,
            status: 'AVAILABLE',
          },
        });
      }
    }

    if (user.role === Role.ORGANIZER && !user.isApproved) {
      throw new ForbiddenException('Your Organizer account is pending Admin approval.');
    }

    const token = this.generateToken(user);

    let profile: any = null;
    if (user.role === Role.VOLUNTEER) profile = user.volunteer;
    else if (user.role === Role.ORGANIZER) profile = user.organizerProfile;
    else if (user.role === Role.PUBLIC) profile = user.publicUserProfile;

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
        // Same field /auth/me returns, so the frontend routes new users to
        // /profile-setup straight after login/signup, not just on later page loads.
        needsProfileSetup: !user.profileComplete,
        profileComplete: user.profileComplete,
        profile,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    const resetToken = this.secureToken();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const emailContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0b5cff; font-weight: 800; margin-bottom: 16px; font-size: 24px;">IndraNetra Password Reset</h2>
        <p style="font-size: 16px; color: #334155; line-height: 1.5;">Hi ${user.name},</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.5;">We received a request to reset your password for your IndraNetra account.</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.5;">Please click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; background-color: #0b5cff; color: white; padding: 12px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 15px;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 20px;">If you did not request a password reset, you can safely ignore this email. The link is valid for 1 hour.</p>
      </div>
    `;

    await this.resendService.sendEmail(
      user.email,
      'Reset your IndraNetra Password',
      emailContent
    );

    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  // `password` here is the new plaintext password. The parameter used to be named
  // `passwordHash`, which described the opposite of what it held.
  async resetPassword(data: { token: string; password: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: data.token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new ConflictException(
        'This password reset link is invalid or has expired. Request a new one.',
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { message: 'Password reset successful. You can now log in.' };
  }

  async completeProfile(userId: string, profileData: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // The role is always the one already fixed at signup/creation — never
    // trust a client-supplied role here, or any authenticated user could
    // self-promote to ORGANIZER (etc.) without going through the approval
    // gate that register()/googleLogin() enforce.
    const role = user.role;

    // Direct profile updates based on role
    if (role === Role.VOLUNTEER) {
      await this.prisma.volunteer.upsert({
        where: { userId: user.id },
        update: {
          phoneNumber: profileData.phoneNumber,
          skills: profileData.skills,
          availability: profileData.availability,
          status: 'AVAILABLE',
        },
        create: {
          userId: user.id,
          phoneNumber: profileData.phoneNumber,
          skills: profileData.skills,
          availability: profileData.availability,
          status: 'AVAILABLE',
        },
      });
    } else if (role === Role.ORGANIZER) {
      await this.prisma.organizerProfile.upsert({
        where: { userId: user.id },
        update: {
          organizationName: profileData.organizationName,
          designation: profileData.designation,
          contactNumber: profileData.contactNumber,
        },
        create: {
          userId: user.id,
          organizationName: profileData.organizationName,
          designation: profileData.designation,
          contactNumber: profileData.contactNumber,
        },
      });
    } else if (role === Role.PUBLIC) {
      await this.prisma.publicUserProfile.upsert({
        where: { userId: user.id },
        update: {
          phoneNumber: profileData.phoneNumber,
          emergencyContact: profileData.emergencyContact,
        },
        create: {
          userId: user.id,
          phoneNumber: profileData.phoneNumber,
          emergencyContact: profileData.emergencyContact,
        },
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        profileComplete: true,
      },
      include: {
        volunteer: true,
        organizerProfile: true,
        publicUserProfile: true,
      },
    });

    let profile: any = null;
    if (updatedUser.role === Role.VOLUNTEER) profile = updatedUser.volunteer;
    else if (updatedUser.role === Role.ORGANIZER) profile = updatedUser.organizerProfile;
    else if (updatedUser.role === Role.PUBLIC) profile = updatedUser.publicUserProfile;

    const token = this.generateToken(updatedUser);

    return {
      token,
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isApproved: updatedUser.isApproved,
      profileComplete: updatedUser.profileComplete,
      profile,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        volunteer: true,
        organizerProfile: true,
        publicUserProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    let profile: any = null;
    if (user.role === Role.VOLUNTEER) profile = user.volunteer;
    else if (user.role === Role.ORGANIZER) profile = user.organizerProfile;
    else if (user.role === Role.PUBLIC) profile = user.publicUserProfile;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isApproved: user.isApproved,
      // The one field the frontend routes on. `profileComplete` is kept alongside it
      // only until the old dashboard is replaced in Phase 4 -- drop it then.
      needsProfileSetup: !user.profileComplete,
      profileComplete: user.profileComplete,
      profile,
    };
  }

  async getPendingOrganizers() {
    return this.prisma.user.findMany({
      where: {
        role: Role.ORGANIZER,
        isApproved: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        organizerProfile: true,
      },
    });
  }

  async approveOrganizer(userId: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isApproved: true },
    });

    const emailContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0b5cff; font-weight: 800; margin-bottom: 16px; font-size: 24px;">Account Approved!</h2>
        <p style="font-size: 16px; color: #334155; line-height: 1.5;">Hi ${updated.name},</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.5;">Your Organizer account has been reviewed and approved by the system administrator.</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.5;">You can now log in to access your event dashboard.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="display: inline-block; background-color: #0b5cff; color: white; padding: 12px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 15px;">Login to Dashboard</a>
        </div>
      </div>
    `;

    try {
      await this.resendService.sendEmail(
        updated.email,
        'Your IndraNetra Organizer Account has been Approved',
        emailContent
      );
    } catch (e) {
      console.warn('Failed to send approval email, proceeding:', e);
    }

    return { message: 'Organizer account approved successfully', user: updated };
  }

  async rejectOrganizer(userId: string) {
    const deleted = await this.prisma.user.delete({
      where: { id: userId },
    });
    return { message: 'Organizer account rejected and deleted successfully', user: deleted };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        volunteer: true,
        organizerProfile: true,
        publicUserProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(id: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (role === Role.VOLUNTEER && user.role !== Role.VOLUNTEER) {
      await this.prisma.volunteer.upsert({
        where: { userId: id },
        update: {},
        create: {
          userId: id,
          status: 'AVAILABLE',
        },
      });
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      include: {
        volunteer: true,
        organizerProfile: true,
        publicUserProfile: true,
      },
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  private generateToken(user: any) {
    return signSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }
}
