import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ClipboardModule } from './clipboard/clipboard.module.js';
import { FilesModule } from './files/files.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [PrismaModule, ClipboardModule, FilesModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
