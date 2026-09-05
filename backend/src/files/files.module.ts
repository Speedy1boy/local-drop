import { Module } from '@nestjs/common';
import { FilesService } from './files.service.js';
import { FilesController } from './files.controller.js';
import { FilesGateway } from './files.gateway.js';

@Module({
  providers: [FilesService, FilesGateway],
  controllers: [FilesController]
})
export class FilesModule {}
