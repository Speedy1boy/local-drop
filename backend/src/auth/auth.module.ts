import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'local-drop-super-secret-key',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
})
export class AuthModule {}