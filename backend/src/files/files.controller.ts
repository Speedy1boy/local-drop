import { 
  Controller, Get, Post, Param, Delete, UseInterceptors, 
  UploadedFile, Res, UseGuards, Query, Body 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import express from 'express';
import { extname, join } from 'path';
import { FilesService } from './files.service.js';
import { FilesGateway } from './files.gateway.js';
import { AuthGuard } from '../auth/auth.guard.js';
import * as shared from '@local-drop/shared';
import { Patch } from '@nestjs/common';

const storageConfig = diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `${uniqueSuffix}${ext}`);
  }
});

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly filesGateway: FilesGateway
  ) {}

  @UseGuards(AuthGuard)
  @Patch(':id/move')
  async moveFile(@Param('id') id: string, @Body('folderId') folderId: string | null) {
    const updatedFile = await this.filesService.moveFile(id, folderId);
    this.filesGateway.broadcastFileMoved(updatedFile);
    return updatedFile;
  }

  @UseGuards(AuthGuard)
  @Patch('folder/:id/move')
  async moveFolder(@Param('id') id: string, @Body('parentId') parentId: string | null) {
    const updatedFolder = await this.filesService.moveFolder(id, parentId);
    this.filesGateway.broadcastFolderMoved(updatedFolder);
    return updatedFolder;
  }

  @UseGuards(AuthGuard)
  @Get()
  getContents(@Query('folderId') folderId?: string) {
    return this.filesService.getContents(folderId || null);
  }

  @UseGuards(AuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: storageConfig }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId?: string
  ) {
    const savedFile = await this.filesService.saveMetadata(file, folderId || null);
    this.filesGateway.broadcastNewFile(savedFile);
    return savedFile;
  }

  @Get('download/:fileName')
  downloadFile(@Param('fileName') fileName: string, @Res() res: express.Response) {
    const filePath = join(process.cwd(), 'uploads', fileName);
    res.download(filePath);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async removeFile(@Param('id') id: string) {
    await this.filesService.remove(id);
    this.filesGateway.broadcastDeletedFile(id);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Post('folder')
  async createFolder(@Body() payload: shared.CreateFolderPayload) {
    const folder = await this.filesService.createFolder(payload.name, payload.parentId || null);
    this.filesGateway.broadcastNewFolder(folder);
    return folder;
  }

  @UseGuards(AuthGuard)
  @Delete('folder/:id')
  async removeFolder(@Param('id') id: string) {
    await this.filesService.removeFolder(id);
    this.filesGateway.broadcastDeletedFolder(id);
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Patch('folder/:id/rename')
  async renameFolder(@Param('id') id: string, @Body('name') name: string) {
    const updatedFolder = await this.filesService.renameFolder(id, name);
    this.filesGateway.broadcastFolderRenamed(updatedFolder);
    return updatedFolder;
  }
}