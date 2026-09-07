import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AdminController } from './admin.controller.js';
import { SecurityService } from './security.service.js';
import { AuthGateway } from './auth.gateway.js';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController, AdminController],
  providers: [AuthService, SecurityService, AuthGateway],
  exports: [AuthService, SecurityService, AuthGateway],
})
export class AuthModule {}