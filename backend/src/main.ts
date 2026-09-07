import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { SecurityService } from './auth/security.service.js';
import { ThrottlerExceptionFilter } from './auth/throttler-exception.filter.js';
import { SERVER_CONFIG } from './rate-limits.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(bodyParser.json({ limit: SERVER_CONFIG.BODY_LIMIT }));
  app.use(bodyParser.urlencoded({ limit: SERVER_CONFIG.BODY_LIMIT, extended: true }));

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const prismaService = app.get(PrismaService);
  
  const dbPin = await prismaService.systemSetting.findUnique({ where: { key: 'app_pin' } });
  if (!dbPin && process.env.APP_PIN) {
    await prismaService.systemSetting.create({ data: { key: 'app_pin', value: process.env.APP_PIN } });
  }

  const maintenance = await prismaService.systemSetting.findUnique({ where: { key: 'maintenance_mode' } });
  if (!maintenance) {
    await prismaService.systemSetting.create({ data: { key: 'maintenance_mode', value: 'false' } });
  }

  const securityService = app.get(SecurityService);
  app.useGlobalFilters(new ThrottlerExceptionFilter(securityService));

  await app.listen(SERVER_CONFIG.PORT, '0.0.0.0');
}
bootstrap();