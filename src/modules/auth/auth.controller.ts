import AuthService from './auth.service';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export default class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
login(
  @Body('userId') userId: string,
  @Body('captchaToken') captchaToken: string,
) {
  return this.authService.login(userId, captchaToken);
}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: any) {
    return this.authService.getMe(req.user.userId);
  }
}
