import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Dr. Abebe Kebede', description: 'Staff full name' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({ example: 'doctor@lunara.et', description: 'Staff email address' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Account initial password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    example: 'doctor',
    enum: ['admin', 'receptionist', 'nurse', 'doctor', 'lab_technician', 'cashier'],
    description: 'Clinic user role',
  })
  @IsEnum(['admin', 'receptionist', 'nurse', 'doctor', 'lab_technician', 'cashier'], {
    message: 'Invalid role specified',
  })
  @IsNotEmpty({ message: 'Role is required' })
  role: 'admin' | 'receptionist' | 'nurse' | 'doctor' | 'lab_technician' | 'cashier';

  @ApiPropertyOptional({ example: '+251911234567', description: 'Contact phone number' })
  @IsString()
  @IsOptional()
  phone?: string;
}
