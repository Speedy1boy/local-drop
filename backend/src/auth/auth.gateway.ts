import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class AuthGateway {
  @WebSocketServer()
  server: Server;

  forceLogout(sessionId: string, isBanned: boolean = false, reason?: string) {
    this.server.emit('forceLogout', { sessionId, isBanned, reason });
  }

  broadcastAdminUpdate(entity: 'sessions' | 'logs' | 'bans') {
    this.server.emit('adminUpdate', entity);
  }
}