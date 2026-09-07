import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SecurityService } from './security.service.js';

@Injectable()
export class IpBlockGuard implements CanActivate {
  constructor(private securityService: SecurityService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = (request.headers['x-forwarded-for'] as string) || request.socket.remoteAddress || 'unknown';
    
    this.securityService.checkIp(ip); 
    
    return true;
  }
}