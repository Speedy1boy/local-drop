import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NoteItem } from '@local-drop/shared';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotesGateway {
  @WebSocketServer() server: Server;

  broadcastNote(action: 'created' | 'updated' | 'deleted', payload: NoteItem | string) {
    this.server.emit(`note_${action}`, payload);
  }
}