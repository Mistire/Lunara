import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Icd10Service } from './icd10.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('ICD-10')
@ApiBearerAuth('JWT-auth')
@Controller('icd10')
@UseGuards(JwtAuthGuard, RolesGuard)
export class Icd10Controller {
  constructor(private icd10Service: Icd10Service) {}

  @Get('search')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Full-text autocomplete search for ICD-10 codes (Doctor & Admin)' })
  @ApiQuery({ name: 'q', description: 'Search term (min 2 chars)', required: true })
  @ApiQuery({ name: 'limit', description: 'Max results (default 20)', required: false })
  @ApiResponse({ status: 200, description: 'Diagnostic codes retrieved successfully' })
  async search(@Query('q') query: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.icd10Service.search(query, limitNum);
  }

  @Get(':code')
  @Roles('doctor', 'admin')
  @ApiOperation({ summary: 'Get ICD-10 code detail by code string' })
  @ApiResponse({ status: 200, description: 'Code detail retrieved' })
  @ApiResponse({ status: 404, description: 'Code not found' })
  async findByCode(@Param('code') code: string) {
    return this.icd10Service.findByCode(code);
  }
}
