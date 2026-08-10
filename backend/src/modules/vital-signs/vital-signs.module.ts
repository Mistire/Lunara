import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { VitalSignsService } from './vital-signs.service';
import { VitalSignsController } from './vital-signs.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [VitalSignsController],
  providers: [VitalSignsService],
  exports: [VitalSignsService],
})
export class VitalSignsModule {}
