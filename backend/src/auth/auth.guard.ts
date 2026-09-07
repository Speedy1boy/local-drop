import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) throw new UnauthorizedException('Токен не предоставлен');

    try {
      const payload = this.jwtService.verify(token);
      const session = await this.authService.validateSession(payload.sessionId);
      request.user = { role: session.role, sessionId: session.id };
      return true;
    } catch {
      throw new UnauthorizedException('Доступ запрещен');
    }
  }
}