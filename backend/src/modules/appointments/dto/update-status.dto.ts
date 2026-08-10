import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    example: 'checked_in',
    enum: ['scheduled', 'checked_in', 'in_progress', 'completed', 'no_show', 'cancelled'],
    description: 'Target appointment status',
  })
  @IsEnum(['scheduled', 'checked_in', 'in_progress', 'completed', 'no_show', 'cancelled'])
  @IsNotEmpty()
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
}
