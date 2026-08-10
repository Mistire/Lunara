import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsNumber, IsInt, Min, Max } from 'class-validator';

export class CreateVitalSignsDto {
  @ApiProperty({ example: 'patient-uuid-here', description: 'Associated patient ID' })
  @IsUUID('4', { message: 'Invalid patient ID format' })
  patientId: string;

  @ApiPropertyOptional({ example: 'appointment-uuid-here', description: 'Associated appointment ID if triage is part of a visit' })
  @IsUUID('4', { message: 'Invalid appointment ID format' })
  @IsOptional()
  appointmentId?: string;

  @ApiPropertyOptional({ example: '120/80', description: 'Blood pressure reading (systolic/diastolic)' })
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @ApiPropertyOptional({ example: 36.8, description: 'Body temperature in Celsius' })
  @IsNumber({}, { message: 'Temperature must be a number' })
  @Min(30, { message: 'Temperature is abnormally low' })
  @Max(45, { message: 'Temperature is abnormally high' })
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ example: 72, description: 'Pulse rate (beats per minute)' })
  @IsInt({ message: 'Pulse rate must be an integer' })
  @Min(30)
  @Max(250)
  @IsOptional()
  pulseRate?: number;

  @ApiPropertyOptional({ example: 16, description: 'Respiratory rate (breaths per minute)' })
  @IsInt({ message: 'Respiratory rate must be an integer' })
  @Min(8)
  @Max(60)
  @IsOptional()
  respiratoryRate?: number;

  @ApiPropertyOptional({ example: 98.5, description: 'Oxygen saturation percentage SpO2' })
  @IsNumber({}, { message: 'Oxygen saturation must be a number' })
  @Min(50)
  @Max(100)
  @IsOptional()
  oxygenSaturation?: number;

  @ApiPropertyOptional({ example: 70.5, description: 'Patient weight in kilograms' })
  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(1)
  @Max(500)
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({ example: 175.0, description: 'Patient height in centimeters' })
  @IsNumber({}, { message: 'Height must be a number' })
  @Min(30)
  @Max(250)
  @IsOptional()
  heightCm?: number;

  @ApiPropertyOptional({ example: 'Patient complains of mild headache.', description: 'Additional clinical triage notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
