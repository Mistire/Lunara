import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QueueModule } from '../queue/queue.module';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController, SoapNotesController } from './consultations.controller';

@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [ConsultationsController, SoapNotesController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
