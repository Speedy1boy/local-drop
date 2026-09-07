import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class AuthGateway {
  @WebSocketServer()
  server: Server;

  forceLogout(sessionId: string) {
    this.server.emit('forceLogout', sessionId);
  }

  broadcastAdminUpdate(entity: 'sessions' | 'logs' | 'bans') {
    this.server.emit('adminUpdate', entity);
  }
}