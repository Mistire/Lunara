import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsString, IsOptional } from 'class-validator';

export class AddDiagnosisDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'ICD-10 Code ID' })
  @IsUUID('4')
  icd10CodeId: string;

  @ApiPropertyOptional({ example: true, description: 'Whether this is the primary diagnosis for the consultation' })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 'Patient has had this chronic condition for years.', description: 'Additional clinical notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
