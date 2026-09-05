import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ClipboardModule } from './clipboard/clipboard.module.js';
import { FilesModule } from './files/files.module.js';

@Module({
  imports: [PrismaModule, ClipboardModule, FilesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
