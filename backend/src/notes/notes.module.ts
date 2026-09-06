import { Module } from '@nestjs/common';
import { NotesService } from './notes.service.js';
import { NotesController } from './notes.controller.js';
import { NotesGateway } from './notes.gateway.js';

@Module({
  providers: [NotesService, NotesGateway],
  controllers: [NotesController]
})
export class NotesModule {}
