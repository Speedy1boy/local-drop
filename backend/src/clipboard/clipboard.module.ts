import { Module } from '@nestjs/common';
import { ClipboardService } from './clipboard.service.js';
import { ClipboardController } from './clipboard.controller.js';
import { ClipboardGateway } from './clipboard.gateway.js';

@Module({
  providers: [ClipboardService, ClipboardGateway],
  controllers: [ClipboardController]
})
export class ClipboardModule {}
