import { Injectable, OnModuleInit, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthGateway } from './auth.gateway.js';
import { MAX_LOGIN_ATTEMPTS } from '../rate-limits.config.js';

@Injectable()
export class SecurityService implements OnModuleInit {
  private blockedIps = new Map<string, string>();
  private failedAttempts = new Map<string, number>();
  private visitTracker = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private authGateway: AuthGateway
  ) {}

  async onModuleInit() {
    const ips = await this.prisma.blockedIp.findMany();
    ips.forEach(record => this.blockedIps.set(record.ip, record.reason));
  }

  checkIp(ip: string) {
    if (this.blockedIps.has(ip)) {
      const reason = this.blockedIps.get(ip);
      const suffix = (reason && reason !== 'Заблокирован администратором' && reason !== 'Brute force PIN') 
        ? `. Причина: ${reason}` 
        : '';
      throw new ForbiddenException(`Ваш IP-адрес заблокирован навсегда${suffix}`);
    }
  }

  async logVisit(ip: string) {
    const now = Date.now();
    const lastVisit = this.visitTracker.get(ip);
    
    if (!lastVisit || (now - lastVisit > 300000)) { 
      await this.prisma.securityLog.create({
        data: { ip, action: 'VISIT', details: 'Открыта страница входа' }
      });
      this.authGateway.broadcastAdminUpdate('logs');
      this.visitTracker.set(ip, now);
    }
  }

  async blockIpPermanently(ip: string, reason: string, userAgent?: string) {
    const exists = await this.prisma.blockedIp.findUnique({ where: { ip } });
    if (!exists) {
      await this.prisma.blockedIp.create({ data: { ip, reason, userAgent } });
      this.authGateway.broadcastAdminUpdate('bans');
    }
    this.blockedIps.set(ip, reason);
  }

  async unblockIp(ip: string) {
    await this.prisma.blockedIp.delete({ where: { ip } }).catch(() => {});
    this.blockedIps.delete(ip);
    this.failedAttempts.delete(ip);
    this.authGateway.broadcastAdminUpdate('bans');
  }

  async handleFailedLogin(ip: string, input: string) {
    await this.prisma.securityLog.create({
      data: { ip, action: 'FAILED_LOGIN', details: `Введен код: ${input}` }
    });
    this.authGateway.broadcastAdminUpdate('logs');

    const attempts = (this.failedAttempts.get(ip) || 0) + 1;
    
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await this.blockIpPermanently(ip, 'Brute force PIN');
      this.failedAttempts.delete(ip);
      throw new ForbiddenException('Слишком много попыток. Ваш IP заблокирован навсегда.');
    }

    this.failedAttempts.set(ip, attempts);
    throw new UnauthorizedException(`Неверный код. Осталось попыток: ${MAX_LOGIN_ATTEMPTS - attempts}`);
  }

  handleSuccessfulLogin(ip: string) {
    this.failedAttempts.delete(ip);
  }
}