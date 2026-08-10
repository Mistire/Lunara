import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';

export class GenerateSlotsDto {
  @ApiPropertyOptional({ example: 'doctor-uuid-here', description: 'Doctor ID. Defaults to current user if doctor' })
  @IsUUID('4')
  @IsOptional()
  doctorId?: string;

  @ApiProperty({ example: '2026-08-01', description: 'Start date of the generation window (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2026-08-31', description: 'End date of the generation window (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
