import { Injectable, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { ResendService } from '../notifications/resend.service';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private prisma: PrismaService,
    private resendService: ResendService,
  ) {}

  async register(data: { email: string; name: string; password: string; role?: Role }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: data.role || Role.PUBLIC_USER,
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
      throw new UnauthorizedException('Invalid email or password');
    }

    const matches = await bcrypt.compare(data.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('Please verify your email address before signing in.');
    }

    const token = this.generateToken(user);

    let profile: any = null;
    if (user.role === Role.VOLUNTEER) profile = user.volunteer;
    else if (user.role === Role.ORGANIZER) profile = user.organizerProfile;
    else if (user.role === Role.PUBLIC_USER) profile = user.publicUserProfile;

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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
      const passwordHash = await bcrypt.hash(Math.random().toString(36), 10);
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || 'Google User',
          passwordHash,
          avatar: avatar || null,
          role: data.role || Role.PUBLIC_USER,
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


    const token = this.generateToken(user);

    let profile: any = null;
    if (user.role === Role.VOLUNTEER) profile = user.volunteer;
    else if (user.role === Role.ORGANIZER) profile = user.organizerProfile;
    else if (user.role === Role.PUBLIC_USER) profile = user.publicUserProfile;

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

  async resetPassword(data: { token: string; passwordHash: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: data.token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new ConflictException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(data.passwordHash, 10);

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

  async completeProfile(userId: string, role: Role, profileData: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

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
    } else if (role === Role.PUBLIC_USER) {
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
        role: role, // Keep or update role
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
    else if (updatedUser.role === Role.PUBLIC_USER) profile = updatedUser.publicUserProfile;

    const token = this.generateToken(updatedUser);

    return {
      token,
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
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
    else if (user.role === Role.PUBLIC_USER) profile = user.publicUserProfile;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profileComplete: user.profileComplete,
      profile,
    };
  }

  private generateToken(user: any) {
    const secret = process.env.JWT_SECRET || 'supersafesecretkeyforindranetra123456';
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      secret,
      { expiresIn: '7d' },
    );
  }
}
