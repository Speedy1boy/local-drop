import { Injectable, OnModuleInit, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthGateway } from './auth.gateway.js';

@Injectable()
export class SecurityService implements OnModuleInit {
  private blockedIps = new Set<string>();
  private failedAttempts = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private authGateway: AuthGateway
  ) {}

  async onModuleInit() {
    const ips = await this.prisma.blockedIp.findMany();
    ips.forEach(record => this.blockedIps.add(record.ip));
  }

  checkIp(ip: string) {
    if (this.blockedIps.has(ip)) {
      throw new ForbiddenException('Ваш IP-адрес заблокирован навсегда.');
    }
  }

  async blockIpPermanently(ip: string, reason: string, userAgent?: string) {
    const exists = await this.prisma.blockedIp.findUnique({ where: { ip } });
    if (!exists) {
      await this.prisma.blockedIp.create({ data: { ip, reason, userAgent } });
      this.authGateway.broadcastAdminUpdate('bans');
    }
    this.blockedIps.add(ip);
  }

  async unblockIp(ip: string) {
    await this.prisma.blockedIp.delete({ where: { ip } }).catch(() => {});
    this.blockedIps.delete(ip);
    this.authGateway.broadcastAdminUpdate('bans');
  }

  async handleFailedLogin(ip: string, input: string) {
    await this.prisma.securityLog.create({
      data: { ip, action: 'FAILED_LOGIN', details: `Введен код: ${input.substring(0, 10)}...` }
    });
    this.authGateway.broadcastAdminUpdate('logs');

    const attempts = (this.failedAttempts.get(ip) || 0) + 1;
    
    if (attempts >= 5) {
      await this.blockIpPermanently(ip, 'Brute force PIN');
      this.failedAttempts.delete(ip);
      throw new ForbiddenException('Слишком много попыток. Ваш IP заблокирован навсегда.');
    }

    this.failedAttempts.set(ip, attempts);
    throw new UnauthorizedException(`Неверный код. Осталось попыток: ${5 - attempts}`);
  }

  handleSuccessfulLogin(ip: string) {
    this.failedAttempts.delete(ip);
  }
}