import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Schedules')
@ApiBearerAuth('JWT-auth')
@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Create or update weekly schedule rules (Doctor/Admin only)' })
  @ApiResponse({ status: 201, description: 'Weekly availability rule configured successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async createOrUpdateSchedule(
    @Body() dto: CreateScheduleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.schedulesService.createOrUpdateSchedule(dto, user);
  }

  @Post('generate')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Pre-generate time slots for a date range (Doctor/Admin only)' })
  @ApiResponse({ status: 201, description: 'Time slots generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Date constraints failed' })
  async generateSlots(
    @Body() dto: GenerateSlotsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.schedulesService.generateSlots(dto, user);
  }

  @Get('doctor/:doctorId')
  @Roles('receptionist', 'nurse', 'doctor', 'admin')
  @ApiOperation({ summary: 'Get doctor weekly availability schedules' })
  @ApiResponse({ status: 200, description: 'Weekly schedules retrieved successfully' })
  async findSchedulesByDoctor(@Param('doctorId') doctorId: string) {
    return this.schedulesService.findSchedulesByDoctor(doctorId);
  }

  @Get('doctor/:doctorId/slots')
  @Roles('receptionist', 'nurse', 'doctor', 'admin')
  @ApiOperation({ summary: 'Get generated time slots for doctor on a specific date' })
  @ApiQuery({ name: 'date', required: true, description: 'Query date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Doctor time slots retrieved successfully' })
  async findSlotsByDoctorAndDate(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.schedulesService.findSlotsByDoctorAndDate(doctorId, date);
  }
}
