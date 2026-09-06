import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { FileItem, FolderItem } from '@local-drop/shared';

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

  broadcastNewFolder(folder: FolderItem) {
    this.server.emit('folderCreated', folder);
  }

  broadcastDeletedFolder(id: string) {
    this.server.emit('folderDeleted', id);
  }
  
  broadcastFileMoved(file: FileItem) {
    this.server.emit('fileMoved', file);
  }
  
  broadcastFolderMoved(folder: FolderItem) {
    this.server.emit('folderMoved', folder);
  }
}