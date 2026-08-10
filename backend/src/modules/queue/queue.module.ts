import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueGateway } from './queue.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'lunara_jwt_secret_key_change_in_production_2024',
      }),
    }),
  ],
  providers: [QueueGateway],
  exports: [QueueGateway],
})
export class QueueModule {}
