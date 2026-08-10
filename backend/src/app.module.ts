import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { Icd10Module } from './modules/icd10/icd10.module';
import { PatientsModule } from './modules/patients/patients.module';
import { VitalSignsModule } from './modules/vital-signs/vital-signs.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    Icd10Module,
    PatientsModule,
    VitalSignsModule,
    SchedulesModule,
    AppointmentsModule,
    QueueModule,
  ],
})
export class AppModule {}
