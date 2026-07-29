import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsEnum(['admin', 'receptionist', 'nurse', 'doctor', 'lab_technician', 'cashier'])
  @IsOptional()
  role?: 'admin' | 'receptionist' | 'nurse' | 'doctor' | 'lab_technician' | 'cashier';

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
