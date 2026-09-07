import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  private getUploadsDir(): string {
    const cwd = process.cwd();
    if (cwd.endsWith('backend')) {
      return path.join(cwd, 'uploads');
    }
    return path.join(cwd, 'backend', 'uploads');
  }

  async getContents(folderId: string | null = null) {
    const folders = await this.prisma.folderItem.findMany({
      where: { parentId: folderId },
      orderBy: { createdAt: 'desc' },
    });
    
    const files = await this.prisma.fileItem.findMany({
      where: { folderId },
      orderBy: { createdAt: 'desc' },
    });
    
    return { folders, files };
  }

  async saveMetadata(file: Express.Multer.File, folderId: string | null = null) {
    const filePath = path.join(this.getUploadsDir(), file.filename);
    
    try {
      const { fileTypeFromFile } = await import('file-type');
      const meta = await fileTypeFromFile(filePath);
      
      if (meta) {
        if (meta.mime === 'application/x-msdownload' && !file.originalname.endsWith('.exe')) {
          await fs.unlink(filePath).catch(() => {});
          throw new BadRequestException('Запрещенный тип файла');
        }
        if (meta.mime.startsWith('application/') && file.mimetype.startsWith('image/')) {
          await fs.unlink(filePath).catch(() => {});
          throw new BadRequestException('Подделка типа файла');
        }
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
    }

    return this.prisma.fileItem.create({
      data: {
        originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        fileName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        folderId,
      },
    });
  }

  async remove(id: string) {
    const fileRecord = await this.prisma.fileItem.findUnique({
      where: { id },
    });

    if (!fileRecord) throw new NotFoundException('Файл не найден');

    const filePath = path.join(this.getUploadsDir(), fileRecord.fileName);
    
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (e) {}

    return this.prisma.fileItem.delete({ where: { id } });
  }

  async createFolder(name: string, parentId: string | null = null) {
    return this.prisma.folderItem.create({
      data: { name, parentId },
    });
  }

  async removeFolder(id: string) {
    const filesToDelete = await this.getAllNestedFiles(id);
    
    for (const file of filesToDelete) {
      const filePath = path.join(this.getUploadsDir(), file.fileName);
      try { await fs.unlink(filePath); } catch (e) {}
    }

    return this.prisma.folderItem.delete({
      where: { id },
    });
  }

  private async getAllNestedFiles(folderId: string): Promise<any[]> {
    const files = await this.prisma.fileItem.findMany({ where: { folderId } });
    const subfolders = await this.prisma.folderItem.findMany({ where: { parentId: folderId } });
    
    let allFiles = [...files];
    for (const sub of subfolders) {
      const nestedFiles = await this.getAllNestedFiles(sub.id);
      allFiles = allFiles.concat(nestedFiles);
    }
    return allFiles;
  }

  async moveFile(id: string, folderId: string | null) {
    return this.prisma.fileItem.update({
      where: { id },
      data: { folderId },
    });
  }
  
  async moveFolder(id: string, parentId: string | null) {
    if (id === parentId) {
      throw new BadRequestException('Нельзя переместить папку саму в себя');
    }
    return this.prisma.folderItem.update({
      where: { id },
      data: { parentId },
    });
  }
  
  async renameFolder(id: string, name: string) {
    return this.prisma.folderItem.update({
      where: { id },
      data: { name },
    });
  }
}