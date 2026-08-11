import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpsertSoapNotesDto {
  @ApiPropertyOptional({ example: 'Patient reports mild chest pain and dry cough.', description: 'Subjective component' })
  @IsString()
  @IsOptional()
  subjective?: string;

  @ApiPropertyOptional({ example: 'BP: 120/80, HR: 72, temp: 37.0 C, clear lungs.', description: 'Objective component' })
  @IsString()
  @IsOptional()
  objective?: string;

  @ApiPropertyOptional({ example: 'Atypical chest pain, query muscular strain.', description: 'Assessment component' })
  @IsString()
  @IsOptional()
  assessment?: string;

  @ApiPropertyOptional({ example: 'Rest, avoid heavy lifting, review in 1 week if no improvement.', description: 'Plan component' })
  @IsString()
  @IsOptional()
  plan?: string;
}
