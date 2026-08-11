import { Controller, Get, Post, Patch, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { UpsertSoapNotesDto } from './dto/upsert-soap-notes.dto';
import { AddDiagnosisDto } from './dto/add-diagnosis.dto';

@ApiTags('Consultations')
@ApiBearerAuth('JWT-auth')
@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Start a consultation for a checked-in appointment (Doctor/Admin only)' })
  @ApiResponse({ status: 201, description: 'Consultation started successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Appointment not checked-in or already has a consultation' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not the doctor assigned to the appointment' })
  @ApiResponse({ status: 404, description: 'Not Found - Appointment not found' })
  async startConsultation(@Body() dto: CreateConsultationDto, @CurrentUser() user: JwtPayload) {
    return this.consultationsService.startConsultation(dto, user);
  }

  @Get(':id')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Get details of a consultation' })
  @ApiResponse({ status: 200, description: 'Consultation details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Consultation not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.consultationsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Update consultation details or status (Doctor/Admin only)' })
  @ApiResponse({ status: 200, description: 'Consultation updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Completed/cancelled consultation' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not the doctor assigned to the consultation' })
  @ApiResponse({ status: 404, description: 'Not Found - Consultation not found' })
  async updateConsultation(
    @Param('id') id: string,
    @Body() dto: UpdateConsultationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.consultationsService.updateConsultation(id, dto, user);
  }

  @Get('patient/:patientId')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Get patient consultation history' })
  @ApiResponse({ status: 200, description: 'Patient consultation history retrieved successfully' })
  async findPatientHistory(@Param('patientId') patientId: string, @CurrentUser() user: JwtPayload) {
    return this.consultationsService.findPatientHistory(patientId, user);
  }

  @Get(':id/diagnoses')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Get diagnoses associated with a consultation' })
  @ApiResponse({ status: 200, description: 'Diagnoses retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Consultation not found' })
  async getDiagnoses(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.consultationsService.getDiagnoses(id, user);
  }

  @Post(':id/diagnoses')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Add a diagnosis (ICD-10 code) to a consultation' })
  @ApiResponse({ status: 201, description: 'Diagnosis added successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Active consultation checks' })
  @ApiResponse({ status: 404, description: 'Not Found - Consultation or ICD-10 code not found' })
  async addDiagnosis(
    @Param('id') id: string,
    @Body() dto: AddDiagnosisDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.consultationsService.addDiagnosis(id, dto, user);
  }

  @Delete(':id/diagnoses/:diagnosisId')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Remove a diagnosis from a consultation' })
  @ApiResponse({ status: 200, description: 'Diagnosis removed successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Active consultation checks' })
  @ApiResponse({ status: 404, description: 'Not Found - Consultation or diagnosis not found' })
  async removeDiagnosis(
    @Param('id') id: string,
    @Param('diagnosisId') diagnosisId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.consultationsService.removeDiagnosis(id, diagnosisId, user);
  }
}

@ApiTags('SOAP Notes')
@ApiBearerAuth('JWT-auth')
@Controller('soap-notes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SoapNotesController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get(':consultationId')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Get SOAP notes for a consultation' })
  @ApiResponse({ status: 200, description: 'SOAP notes retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Consultation not found' })
  async getSoapNotes(@Param('consultationId') consultationId: string, @CurrentUser() user: JwtPayload) {
    return this.consultationsService.getSoapNotes(consultationId, user);
  }

  @Put(':consultationId')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Create or update SOAP notes for a consultation (Doctor/Admin only)' })
  @ApiResponse({ status: 200, description: 'SOAP notes upserted successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Active consultation checks' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not the doctor assigned' })
  @ApiResponse({ status: 404, description: 'Not Found - Consultation not found' })
  async upsertSoapNotes(
    @Param('consultationId') consultationId: string,
    @Body() dto: UpsertSoapNotesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.consultationsService.upsertSoapNotes(consultationId, dto, user);
  }
}
