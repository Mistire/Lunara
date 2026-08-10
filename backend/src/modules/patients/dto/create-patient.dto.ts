import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ example: 'Almaz Ayana', description: 'Patient full name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({ example: '1995-04-12', description: 'Patient date of birth (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Invalid date of birth format' })
  @IsNotEmpty({ message: 'Date of birth is required' })
  dateOfBirth: string;

  @ApiProperty({ example: 'female', enum: ['male', 'female', 'other'], description: 'Patient sex' })
  @IsEnum(['male', 'female', 'other'], { message: 'Sex must be male, female, or other' })
  @IsNotEmpty({ message: 'Sex is required' })
  sex: 'male' | 'female' | 'other';

  @ApiPropertyOptional({ example: '+251912345678', description: 'Patient contact phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'almaz.ayana@gmail.com', description: 'Patient email address' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa, Bole Sub-City, Woreda 03', description: 'Patient physical address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 'O+',
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    description: 'Patient blood group',
  })
  @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    message: 'Invalid blood group specified',
  })
  @IsOptional()
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

  @ApiPropertyOptional({ example: 'Hypertension', description: 'Known chronic medical conditions' })
  @IsString()
  @IsOptional()
  chronicConditions?: string;

  @ApiPropertyOptional({ example: 'Penicillin', description: 'Known drug or food allergies' })
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiPropertyOptional({ example: 'Kebede Ayana', description: 'Emergency contact full name' })
  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+251911998877', description: 'Emergency contact phone number' })
  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ example: 'Father', description: 'Relationship to emergency contact' })
  @IsString()
  @IsOptional()
  emergencyContactRel?: string;
}
