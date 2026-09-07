import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ClipboardModule } from './clipboard/clipboard.module.js';
import { FilesModule } from './files/files.module.js';
import { AuthModule } from './auth/auth.module.js';
import { NotesModule } from './notes/notes.module.js';
import { IpBlockGuard } from './auth/ip-block.guard.js';
import { RATE_LIMITS } from './rate-limits.config.js';

@Module({
  imports: [
    PrismaModule, 
    ClipboardModule, 
    FilesModule, 
    AuthModule, 
    NotesModule,
    ThrottlerModule.forRoot([{
      ttl: RATE_LIMITS.GLOBAL.ttl,
      limit: RATE_LIMITS.GLOBAL.limit, 
    }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: IpBlockGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule {}