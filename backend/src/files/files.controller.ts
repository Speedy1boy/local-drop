import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Delete, 
  UseInterceptors, 
  UploadedFile,
  Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import express from 'express';
import { extname, join } from 'path';
import { FilesService } from './files.service.js';
import { FilesGateway } from './files.gateway.js';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';

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
  @Get()
  getAllFiles() {
    return this.filesService.findAll();
  }

  @UseGuards(AuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: storageConfig }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const savedFile = await this.filesService.saveMetadata(file);
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
}