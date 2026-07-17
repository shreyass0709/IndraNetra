import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Request, Res, Param } from '@nestjs/common';
import { AuthThrottlerGuard } from './auth-throttler.guard';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from '@prisma/client';
import { SESSION_TTL_SECONDS } from '../common/jwt.util';
import {
  RegisterDto,
  LoginDto,
  GoogleLoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

// In production the cookie must be `secure` (HTTPS-only); browsers additionally
// require `sameSite: 'none'` whenever `secure` is true for cross-site requests.
const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? ('none' as const) : ('lax' as const),
  path: '/',
};

// Derived from the token's own lifetime so the cookie can't outlive the JWT inside
// it (which would show a logged-in UI that 401s on every request).
const SESSION_COOKIE = {
  ...SESSION_COOKIE_OPTIONS,
  maxAge: SESSION_TTL_SECONDS * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Throttled endpoints: the three an attacker can hammer without an account.
  // ThrottlerGuard is applied per-route rather than to the whole controller on
  // purpose -- /auth/me is polled by every page load and must not be rate limited.
  @Post('register')
  @UseGuards(AuthThrottlerGuard)
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('login')
  @UseGuards(AuthThrottlerGuard)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.login(body);

    res.cookie('indranetra_session', result.token, SESSION_COOKIE);

    // The token stays out of the response body: it lives in the httpOnly cookie so
    // that page JavaScript (and anything that gets injected into it) can't read it.
    const { token, ...output } = result;
    return output;
  }

  @Post('google')
  @UseGuards(AuthThrottlerGuard)
  async googleLogin(@Body() body: GoogleLoginDto, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.googleLogin(body);

    res.cookie('indranetra_session', result.token, SESSION_COOKIE);

    const { token, ...output } = result;
    return output;
  }

  @Post('forgot-password')
  @UseGuards(AuthThrottlerGuard)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @UseGuards(AuthThrottlerGuard)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('complete-profile')
  @UseGuards(AuthGuard)
  async completeProfile(
    @Request() req: any,
    @Body() body: { profileData: any },
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.completeProfile(req.user.id, body.profileData);

    // Re-issue the cookie so the refreshed claims replace the old ones.
    res.cookie('indranetra_session', result.token, SESSION_COOKIE);

    const { token, ...output } = result;
    return output;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('indranetra_session', SESSION_COOKIE_OPTIONS);
    return { message: 'Logged out successfully' };
  }

  @Get('pending-organizers')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getPendingOrganizers() {
    return this.authService.getPendingOrganizers();
  }

  @Post('approve-organizer/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveOrganizer(@Param('id') id: string) {
    return this.authService.approveOrganizer(id);
  }

  @Post('reject-organizer/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async rejectOrganizer(@Param('id') id: string) {
    return this.authService.rejectOrganizer(id);
  }

  @Get('users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Patch('users/:id/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: Role },
  ) {
    return this.authService.updateUserRole(id, body.role);
  }

  @Delete('users/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
