import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ClipboardService } from './clipboard.service.js';
import { ClipboardGateway } from './clipboard.gateway.js';
import { CreateClipboardDto } from './dto/create-clipboard.dto.js';
import { AuthGuard } from '../auth/auth.guard.js';

@UseGuards(AuthGuard)
@Controller('clipboard')
export class ClipboardController {
  constructor(
    private readonly clipboardService: ClipboardService,
    private readonly clipboardGateway: ClipboardGateway,
  ) {}

  @Get()
  getAll() {
    return this.clipboardService.findAll();
  }

  @Post()
  async create(@Body() createDto: CreateClipboardDto) {
    const item = await this.clipboardService.create(createDto);
    this.clipboardGateway.broadcastNewItem(item);
    return item;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deletedItem = await this.clipboardService.remove(id);
    this.clipboardGateway.broadcastDeletedItem(id);
    return deletedItem;
  }
}