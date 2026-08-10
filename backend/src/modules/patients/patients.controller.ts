import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles('receptionist', 'admin')
  @ApiOperation({ summary: 'Register a new patient (Receptionist/Admin only)' })
  @ApiResponse({ status: 201, description: 'Patient registered successfully' })
  @ApiResponse({ status: 409, description: 'Patient email duplicate error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(@Body() dto: CreatePatientDto, @CurrentUser() user: JwtPayload) {
    return this.patientsService.create(dto, user);
  }

  @Get()
  @Roles('receptionist', 'nurse', 'doctor', 'admin')
  @ApiOperation({ summary: 'List and search patients by name, MRN, or phone (Receptionist/Nurse/Doctor/Admin)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for name, MRN, or phone number' })
  @ApiResponse({ status: 200, description: 'List of patients retrieved successfully' })
  async findAll(@Query('search') search: string, @CurrentUser() user: JwtPayload) {
    return this.patientsService.findAll(user, search);
  }

  @Get(':id')
  @Roles('receptionist', 'nurse', 'doctor', 'admin')
  @ApiOperation({ summary: 'Get details of a specific patient' })
  @ApiResponse({ status: 200, description: 'Patient details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.patientsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('receptionist', 'admin')
  @ApiOperation({ summary: 'Update patient profile details (Receptionist/Admin only)' })
  @ApiResponse({ status: 200, description: 'Patient profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.patientsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Soft delete a patient record (Admin only)' })
  @ApiResponse({ status: 200, description: 'Patient record soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.patientsService.remove(id, user);
  }
}
