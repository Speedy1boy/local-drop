import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateClipboardDto } from './dto/create-clipboard.dto.js';

@Injectable()
export class ClipboardService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.clipboardItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async create(createDto: CreateClipboardDto) {
    return this.prisma.clipboardItem.create({
      data: {
        content: createDto.content,
        type: createDto.type || 'text',
      },
    });
  }

  async remove(id: string) {
    return this.prisma.clipboardItem.delete({
      where: { id },
    });
  }
}