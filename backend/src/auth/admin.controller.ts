import { Controller, Get, Post, Body, UseGuards, Delete, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthGuard } from './auth.guard.js';
import { AdminGuard } from './admin.guard.js';
import { SecurityService } from './security.service.js';
import { AuthGateway } from './auth.gateway.js';
import * as fs from 'fs/promises';
import * as path from 'path';

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
  async killSession(@Param('id') id: string, isBanned: boolean = false, reason?: string) {
    await this.prisma.deviceSession.delete({ where: { id } }).catch(() => {});
    this.authGateway.forceLogout(id, isBanned, reason);
    this.authGateway.broadcastAdminUpdate('sessions');
    return { success: true };
  }

  @Post('ban-session/:id')
  async banSession(@Param('id') id: string, @Body('reason') customReason?: string) {
    const session = await this.prisma.deviceSession.findUnique({ where: { id } });
    if (session) {
      const finalReason = customReason?.trim() ? customReason.trim() : 'Заблокирован администратором';
      await this.securityService.blockIpPermanently(session.ip, finalReason, session.userAgent || undefined);
      await this.killSession(id, true, finalReason);
    }
    return { success: true };
  }

  @Post('ban-ip')
  async banIp(@Body('ip') ip: string, @Body('reason') customReason?: string) {
    const finalReason = customReason?.trim() ? customReason.trim() : 'Заблокирован администратором (вручную)';
    await this.securityService.blockIpPermanently(ip, finalReason, 'Неизвестно');
    
    const activeSessions = await this.prisma.deviceSession.findMany({ where: { ip } });
    for (const session of activeSessions) {
      await this.killSession(session.id, true, finalReason);
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

    const guestSessions = await this.prisma.deviceSession.findMany({ where: { role: 'guest' } });
    for (const session of guestSessions) {
      this.authGateway.forceLogout(session.id, false);
    }
    await this.prisma.deviceSession.deleteMany({ where: { role: 'guest' } });

    this.authGateway.broadcastAdminUpdate('sessions');
    return { success: true };
  }

  @Post('change-pin')
  async changePin(@Body('newPin') newPin: string) {
    await this.prisma.systemSetting.upsert({
      where: { key: 'app_pin' },
      update: { value: newPin },
      create: { key: 'app_pin', value: newPin }
    });
    
    await this.resetAllGuests();
    return { success: true };
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

  @Post('maintenance/duplicates')
  async cleanupDuplicates() {
    const files = await this.prisma.fileItem.findMany({ orderBy: { createdAt: 'asc' } });
    const seen = new Set();
    let deleted = 0;
    const uploadsDir = path.join(process.cwd(), 'uploads');

    for (const f of files) {
      const key = `${f.size}-${f.originalName}`;
      if (seen.has(key)) {
        await this.prisma.fileItem.delete({ where: { id: f.id } });
        await fs.unlink(path.join(uploadsDir, f.fileName)).catch(() => {});
        deleted++;
      } else {
        seen.add(key);
      }
    }
    return { deleted };
  }

  @Post('maintenance/zombies')
  async cleanupZombies() {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    let filesOnDisk: string[] = [];
    try { filesOnDisk = await fs.readdir(uploadsDir); } catch(e) {}
    
    const dbFiles = await this.prisma.fileItem.findMany();
    const dbFileNames = new Set(dbFiles.map(f => f.fileName));

    let zombies = 0;
    let ghosts = 0;

    for (const file of filesOnDisk) {
      if (file !== '.gitkeep' && !dbFileNames.has(file)) {
        await fs.unlink(path.join(uploadsDir, file)).catch(()=>{});
        zombies++;
      }
    }

    const diskSet = new Set(filesOnDisk);
    for (const dbFile of dbFiles) {
      if (!diskSet.has(dbFile.fileName)) {
        await this.prisma.fileItem.delete({ where: { id: dbFile.id } });
        ghosts++;
      }
    }

    return { zombies, ghosts };
  }

  @Post('maintenance/clipboard')
  async cleanupClipboard() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const result = await this.prisma.clipboardItem.deleteMany({
      where: { createdAt: { lt: sevenDaysAgo } }
    });
    
    return { deleted: result.count };
  }
}