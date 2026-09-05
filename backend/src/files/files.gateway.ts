import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { FileItem } from '@local-drop/shared';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class FilesGateway {
  @WebSocketServer()
  server: Server;

  broadcastNewFile(file: FileItem) {
    this.server.emit('fileUploaded', file);
  }

  broadcastDeletedFile(id: string) {
    this.server.emit('fileDeleted', id);
  }
}