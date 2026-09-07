import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { SecurityService } from './security.service.js';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  constructor(private securityService: SecurityService) {}

  async catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const ip = (request.headers['x-forwarded-for'] as string) || request.socket.remoteAddress || 'unknown';

    await this.securityService.blockIpPermanently(ip, 'Спам запросами (Rate Limit Exceeded)');

    response.status(403).json({
      statusCode: 403,
      message: 'Вы были заблокированы навсегда за превышение лимитов запросов.',
    });
  }
}