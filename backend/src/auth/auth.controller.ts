import { Controller, Post, Body, Req, Get, ServiceUnavailableException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SecurityService } from './security.service.js';
import { RATE_LIMITS } from '../rate-limits.config.js';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private securityService: SecurityService
  ) {}

  @Get('ping')
  async ping(@Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    this.securityService.checkIp(ip);
    await this.securityService.logVisit(ip);
    return { status: 'ok' };
  }

  @Throttle({ default: RATE_LIMITS.AUTH })
  @Post('login')
  async login(@Body('pin') input: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    this.securityService.checkIp(ip);

    const dbPinSetting = await this.prisma.systemSetting.findUnique({ where: { key: 'app_pin' } });
    const currentPin = dbPinSetting?.value || process.env.APP_PIN;
    
    const maintenanceSetting = await this.prisma.systemSetting.findUnique({ where: { key: 'maintenance_mode' } });
    const isMaintenance = maintenanceSetting?.value === 'true';

    let role: 'guest' | 'admin' | null = null;
    
    if (input === process.env.ADMIN_PASSWORD) {
      role = 'admin';
    } else if (input === currentPin) {
      if (isMaintenance) {
        throw new ServiceUnavailableException('Сайт на обслуживании.');
      }
      role = 'guest';
    }

    if (!role) {
      return this.securityService.handleFailedLogin(ip, input);
    }

    this.securityService.handleSuccessfulLogin(ip);
    return this.authService.createSession(ip, userAgent, role);
  }
}