import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @Post('login')
  login(@Body('pin') pin: string) {
    if (pin === process.env.APP_PIN) {
      const token = this.jwtService.sign({ authorized: true });
      return { token };
    }
    throw new UnauthorizedException('Неверный PIN-код');
  }
}