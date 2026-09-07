import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthGateway } from './auth.gateway.js';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private authGateway: AuthGateway
  ) {}

  async createSession(ip: string, userAgent: string, role: 'guest' | 'admin') {
    let versionSetting = await this.prisma.systemSetting.findUnique({ where: { key: `${role}TokenVersion` } });
    if (!versionSetting) {
      versionSetting = await this.prisma.systemSetting.create({ data: { key: `${role}TokenVersion`, value: '1' } });
    }
    const tokenVersion = parseInt(versionSetting.value, 10);

    const session = await this.prisma.deviceSession.create({
      data: { ip, userAgent, role, tokenVersion },
    });

    this.authGateway.broadcastAdminUpdate('sessions');

    const token = this.jwtService.sign({ sessionId: session.id, role });
    return { token, role };
  }

  async validateSession(sessionId: string) {
    const session = await this.prisma.deviceSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new UnauthorizedException('Сессия не найдена или была удалена');

    const versionSetting = await this.prisma.systemSetting.findUnique({ where: { key: `${session.role}TokenVersion` } });
    const currentGlobalVersion = versionSetting ? parseInt(versionSetting.value, 10) : 1;

    if (session.tokenVersion !== currentGlobalVersion) {
      await this.prisma.deviceSession.delete({ where: { id: sessionId } });
      throw new UnauthorizedException('Срок действия доступа истек');
    }

    this.prisma.deviceSession.update({ where: { id: sessionId }, data: { lastActive: new Date() } }).catch(() => {});

    return session;
  }
}