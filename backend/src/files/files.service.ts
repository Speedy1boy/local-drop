import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.fileItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveMetadata(file: Express.Multer.File) {
    return this.prisma.fileItem.create({
      data: {
        originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        fileName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
      },
    });
  }

  async remove(id: string) {
    const fileRecord = await this.prisma.fileItem.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      throw new NotFoundException('Файл не найден');
    }

    const filePath = path.join(process.cwd(), 'uploads', fileRecord.fileName);
    
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (e) {
      console.warn(`Файл ${filePath} не найден на диске, удаляем только из БД`);
    }

    return this.prisma.fileItem.delete({
      where: { id },
    });
  }
}