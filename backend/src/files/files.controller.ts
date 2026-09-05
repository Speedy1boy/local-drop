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
  constructor(private readonly filesService: FilesService) {}

  @Get()
  getAllFiles() {
    return this.filesService.findAll();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: storageConfig }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.saveMetadata(file);
  }

  @Get('download/:fileName')
  downloadFile(@Param('fileName') fileName: string, @Res() res: express.Response) {
    const filePath = join(process.cwd(), 'uploads', fileName);
    res.download(filePath);
  }

  @Delete(':id')
  removeFile(@Param('id') id: string) {
    return this.filesService.remove(id);
  }
}