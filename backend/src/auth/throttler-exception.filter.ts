import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { SecurityService } from './security.service.js';
import { RATE_LIMIT_MESSAGES, ANTI_SPAM } from '../rate-limits.config.js';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  private spamTracker = new Map<string, { count: number, timer: NodeJS.Timeout }>();

  constructor(private securityService: SecurityService) {}

  async catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const ip = (request.headers['x-forwarded-for'] as string) || request.socket.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    const record = this.spamTracker.get(ip) || { 
      count: 0, 
      timer: setTimeout(() => this.spamTracker.delete(ip), ANTI_SPAM.TRACKER_TTL) 
    };
    
    record.count++;
    this.spamTracker.set(ip, record);

    if (record.count >= ANTI_SPAM.MAX_THROTTLER_ERRORS) {
      await this.securityService.blockIpPermanently(ip, 'Спам-атака (DDOS)', userAgent);
      clearTimeout(record.timer);
      this.spamTracker.delete(ip);
      return response.status(403).json({ message: 'Ваш IP-адрес заблокирован за спам.' });
    }

    let message = RATE_LIMIT_MESSAGES.DEFAULT;
    if (request.url.includes('/auth/login')) message = RATE_LIMIT_MESSAGES.AUTH;
    else if (request.url.includes('/files')) message = RATE_LIMIT_MESSAGES.FILES;
    else if (request.url.includes('/notes')) message = RATE_LIMIT_MESSAGES.NOTES;
    else if (request.url.includes('/clipboard')) message = RATE_LIMIT_MESSAGES.CLIPBOARD;

    response.status(429).json({ message });
  }
}