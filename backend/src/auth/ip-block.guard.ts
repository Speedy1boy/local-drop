import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SecurityService } from './security.service.js';

@Injectable()
export class IpBlockGuard implements CanActivate {
  constructor(private securityService: SecurityService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    let ip = (request.headers['x-forwarded-for'] as string) || request.socket.remoteAddress || 'unknown';
    
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }

    if (ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }

    request.rawIp = ip; 
    
    this.securityService.checkIp(ip); 
    
    return true;
  }
}