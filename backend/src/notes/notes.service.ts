import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateNoteDto } from './dto/create-note.dto.js';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.noteItem.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  create(dto: CreateNoteDto) {
    return this.prisma.noteItem.create({
      data: { ...dto, tags: dto.tags || [] }
    });
  }

  update(id: string, dto: CreateNoteDto) {
    return this.prisma.noteItem.update({
      where: { id },
      data: { ...dto, tags: dto.tags || [] }
    });
  }

  remove(id: string) {
    return this.prisma.noteItem.delete({ where: { id } });
  }
}