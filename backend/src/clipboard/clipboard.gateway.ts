import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ClipboardService } from './clipboard.service.js';
import { CreateClipboardDto } from './dto/create-clipboard.dto.js';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ClipboardGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly clipboardService: ClipboardService) {}

  @SubscribeMessage('newClipboardItem')
  async handleNewItem(@MessageBody() createDto: CreateClipboardDto) {
    const savedItem = await this.clipboardService.create(createDto);
    
    this.server.emit('clipboardUpdated', savedItem);
    
    return savedItem;
  }

  broadcastNewItem(item: any) {
    this.server.emit('clipboardUpdated', item);
  }

  broadcastDeletedItem(id: string) {
    this.server.emit('clipboardDeleted', id);
  }
}