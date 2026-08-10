import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, Min, Max, Matches } from 'class-validator';

export class CreateScheduleDto {
  @ApiPropertyOptional({ example: 'doctor-uuid-here', description: 'Doctor ID. Defaults to current user if doctor' })
  @IsUUID('4')
  @IsOptional()
  doctorId?: string;

  @ApiProperty({ example: 1, description: 'Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '08:00', description: 'Start time in 24-hour HH:MM format' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Start time must be in HH:MM format' })
  startTime: string;

  @ApiProperty({ example: '12:00', description: 'End time in 24-hour HH:MM format' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'End time must be in HH:MM format' })
  endTime: string;

  @ApiPropertyOptional({ example: 30, description: 'Duration of each time slot in minutes' })
  @IsInt()
  @Min(10)
  @Max(180)
  @IsOptional()
  slotDurationMinutes?: number;
}
