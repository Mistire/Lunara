import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsEnum, IsNotEmpty, IsDateString, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'patient-uuid-here', description: 'Patient ID being booked' })
  @IsUUID('4')
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'doctor-uuid-here', description: 'Doctor ID' })
  @IsUUID('4')
  @IsNotEmpty()
  doctorId: string;

  @ApiPropertyOptional({ example: 'slot-uuid-here', description: 'Time slot ID. Mandatory if type is scheduled' })
  @IsUUID('4')
  @IsOptional()
  slotId?: string;

  @ApiPropertyOptional({ example: 'walk_in', enum: ['walk_in', 'scheduled'], description: 'Booking type' })
  @IsEnum(['walk_in', 'scheduled'])
  @IsOptional()
  type?: 'walk_in' | 'scheduled';

  @ApiProperty({ example: '2026-08-03', description: 'Scheduled date of consultation (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @ApiPropertyOptional({ example: 'Patient has high blood pressure history.', description: 'Appointment notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
