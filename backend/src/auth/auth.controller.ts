import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Request, Res, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; name: string; password: string; role?: Role },
  ) {
    return this.authService.register(body);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.login(body);
    
    // Set HTTP-only cookie
    res.cookie('indranetra_session', result.token, {
      httpOnly: true,
      secure: false, // Set to true if running over HTTPS in production
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove token from output body to satisfy security
    const { token, ...output } = result;
    return output;
  }

  @Post('google')
  async googleLogin(
    @Body() body: { idToken: string; role?: Role },
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.googleLogin(body);
    
    // Set HTTP-only cookie
    res.cookie('indranetra_session', result.token, {
      httpOnly: true,
      secure: false, // Set to true if running over HTTPS in production
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { token, ...output } = result;
    return output;
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; passwordHash: string }) {
    return this.authService.resetPassword(body);
  }

  @Post('complete-profile')
  @UseGuards(AuthGuard)
  async completeProfile(
    @Request() req: any,
    @Body() body: { role: Role; profileData: any },
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.authService.completeProfile(req.user.id, body.role, body.profileData);
    
    // Set HTTP-only cookie with updated role token
    res.cookie('indranetra_session', result.token, {
      httpOnly: true,
      secure: false, // Set to true if running over HTTPS in production
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { token, ...output } = result;
    return output;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('indranetra_session', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
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
