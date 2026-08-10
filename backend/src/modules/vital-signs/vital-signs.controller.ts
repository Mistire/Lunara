import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VitalSignsService } from './vital-signs.service';
import { CreateVitalSignsDto } from './dto/create-vital-signs.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Vital Signs')
@ApiBearerAuth('JWT-auth')
@Controller('vital-signs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VitalSignsController {
  constructor(private readonly vitalSignsService: VitalSignsService) {}

  @Post()
  @Roles('nurse', 'admin')
  @ApiOperation({ summary: 'Record vital signs at triage (Nurse/Admin only)' })
  @ApiResponse({ status: 201, description: 'Vital signs recorded successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(@Body() dto: CreateVitalSignsDto, @CurrentUser() user: JwtPayload) {
    return this.vitalSignsService.create(dto, user);
  }

  @Get('patient/:patientId')
  @Roles('nurse', 'doctor', 'admin')
  @ApiOperation({ summary: 'Get all recorded vital signs history for a patient (Nurse/Doctor/Admin)' })
  @ApiResponse({ status: 200, description: 'Vital signs history retrieved successfully' })
  async findByPatient(@Param('patientId') patientId: string) {
    return this.vitalSignsService.findByPatient(patientId);
  }

  @Get('appointment/:appointmentId')
  @Roles('nurse', 'doctor', 'admin')
  @ApiOperation({ summary: 'Get specific vital signs recorded for an appointment (Nurse/Doctor/Admin)' })
  @ApiResponse({ status: 200, description: 'Appointment vital signs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vital signs for appointment not found' })
  async findByAppointment(@Param('appointmentId') appointmentId: string) {
    return this.vitalSignsService.findByAppointment(appointmentId);
  }
}
