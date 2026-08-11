import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateConsultationDto {
  @ApiPropertyOptional({ example: 'Patient complains of chest pain, shortness of breath, and fatigue', description: 'Chief complaint' })
  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @ApiPropertyOptional({ example: 'completed', enum: ['in_progress', 'completed', 'cancelled'], description: 'Consultation status' })
  @IsIn(['in_progress', 'completed', 'cancelled'])
  @IsOptional()
  status?: 'in_progress' | 'completed' | 'cancelled';
}
