import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateConsultationDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Appointment ID' })
  @IsUUID('4')
  appointmentId: string;

  @ApiPropertyOptional({ example: 'Patient complains of chest pain and shortness of breath', description: 'Chief complaint' })
  @IsString()
  @IsOptional()
  chiefComplaint?: string;
}
