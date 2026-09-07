import { Controller, Get, Post, Body, UseGuards, Delete, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthGuard } from './auth.guard.js';
import { AdminGuard } from './admin.guard.js';
import { SecurityService } from './security.service.js';
import { AuthGateway } from './auth.gateway.js';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private securityService: SecurityService,
    private authGateway: AuthGateway
  ) {}

  @Get('sessions')
  async getSessions() {
    return this.prisma.deviceSession.findMany({ orderBy: { lastActive: 'desc' } });
  }

  @Delete('sessions/:id')
  async killSession(@Param('id') id: string) {
    await this.prisma.deviceSession.delete({ where: { id } });
    this.authGateway.forceLogout(id);
    this.authGateway.broadcastAdminUpdate('sessions');
    return { success: true };
  }

  @Post('ban-session/:id')
  async banSession(@Param('id') id: string) {
    const session = await this.prisma.deviceSession.findUnique({ where: { id } });
    if (session) {
      await this.securityService.blockIpPermanently(session.ip, 'Заблокирован администратором', session.userAgent);
      await this.killSession(id);
    }
    return { success: true };
  }

  @Get('security-logs')
  async getSecurityLogs() {
    return this.prisma.securityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  @Get('blocked-ips')
  async getBlockedIps() {
    return this.prisma.blockedIp.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('unblock-ip')
  async unblockIp(@Body('ip') ip: string) {
    await this.securityService.unblockIp(ip);
    return { success: true };
  }

  @Post('reset-guests')
  async resetAllGuests() {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: 'guestTokenVersion' } });
    const currentVersion = setting ? parseInt(setting.value, 10) : 1;
    
    await this.prisma.systemSetting.upsert({
      where: { key: 'guestTokenVersion' },
      update: { value: (currentVersion + 1).toString() },
      create: { key: 'guestTokenVersion', value: '2' }
    });
    this.authGateway.broadcastAdminUpdate('sessions');
    return { success: true };
  }

  @Post('change-pin')
  async changePin(@Body('newPin') newPin: string) {
    return this.prisma.systemSetting.upsert({
      where: { key: 'app_pin' },
      update: { value: newPin },
      create: { key: 'app_pin', value: newPin }
    });
  }

  @Post('toggle-maintenance')
  async toggleMaintenance(@Body('enabled') enabled: boolean) {
    await this.prisma.systemSetting.upsert({
      where: { key: 'maintenance_mode' },
      update: { value: enabled.toString() },
      create: { key: 'maintenance_mode', value: enabled.toString() }
    });
    
    if (enabled) {
      await this.resetAllGuests();
    }
    return { success: true, maintenance: enabled };
  }
}