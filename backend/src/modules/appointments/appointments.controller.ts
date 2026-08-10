import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('receptionist', 'admin')
  @ApiOperation({ summary: 'Book a new walk-in or scheduled appointment (Receptionist/Admin only)' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 409, description: 'Conflict - Time slot is already booked' })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation or slot mismatches' })
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: JwtPayload) {
    return this.appointmentsService.create(dto, user);
  }

  @Get()
  @Roles('receptionist', 'nurse', 'doctor', 'admin')
  @ApiOperation({ summary: 'List and filter appointments (Receptionist/Nurse/Doctor/Admin)' })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Filter by Doctor ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by scheduled date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by appointment status' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter by Patient ID' })
  @ApiResponse({ status: 200, description: 'Appointments list retrieved successfully' })
  async findAll(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
    @Query('status') status: string,
    @Query('patientId') patientId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.appointmentsService.findAll(user, { doctorId, date, status, patientId });
  }

  @Get(':id')
  @Roles('receptionist', 'nurse', 'doctor', 'admin')
  @ApiOperation({ summary: 'Get details of a specific appointment' })
  @ApiResponse({ status: 200, description: 'Appointment details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.appointmentsService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles('receptionist', 'nurse', 'doctor', 'admin')
  @ApiOperation({ summary: 'Update appointment lifecycle status (Receptionist/Nurse/Doctor/Admin)' })
  @ApiResponse({ status: 200, description: 'Appointment status updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.appointmentsService.updateStatus(id, dto.status, user);
  }
}
