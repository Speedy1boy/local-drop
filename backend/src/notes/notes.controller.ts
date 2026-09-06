import { Controller, Get, Post, Put, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service.js';
import { NotesGateway } from './notes.gateway.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { AuthGuard } from '../auth/auth.guard.js';

@UseGuards(AuthGuard)
@Controller('notes')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly notesGateway: NotesGateway
  ) {}

  @Get()
  getAll() {
    return this.notesService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateNoteDto) {
    const note = await this.notesService.create(dto);
    this.notesGateway.broadcastNote('created', note);
    return note;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CreateNoteDto) {
    const note = await this.notesService.update(id, dto);
    this.notesGateway.broadcastNote('updated', note);
    return note;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.notesService.remove(id);
    this.notesGateway.broadcastNote('deleted', id);
    return { success: true };
  }
}