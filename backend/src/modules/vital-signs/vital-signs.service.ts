import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { vitalSigns } from '../../database/schema/vital-signs';
import { patients } from '../../database/schema/patients';
import { CreateVitalSignsDto } from './dto/create-vital-signs.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class VitalSignsService {
  constructor(private databaseService: DatabaseService) {}

  async create(dto: CreateVitalSignsDto, currentUser: JwtPayload) {
    // 1. Verify patient exists and belongs to the same clinic
    const patientList = await this.databaseService.db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.id, dto.patientId))
      .limit(1);

    if (patientList.length === 0) {
      throw new NotFoundException(`Patient with ID ${dto.patientId} not found`);
    }

    // 2. Calculate BMI if weight and height are provided
    let bmi: string | null = null;
    if (dto.weightKg && dto.heightCm) {
      const heightM = dto.heightCm / 100;
      const bmiVal = dto.weightKg / (heightM * heightM);
      bmi = bmiVal.toFixed(2);
    }

    // 3. Insert and return vital signs (stringify numbers for Drizzle numeric types)
    const [newVitals] = await this.databaseService.db
      .insert(vitalSigns)
      .values({
        patientId: dto.patientId,
        appointmentId: dto.appointmentId || null,
        recordedBy: currentUser.sub, // staff user id
        bloodPressure: dto.bloodPressure || null,
        temperature: dto.temperature !== undefined ? dto.temperature.toFixed(1) : null,
        pulseRate: dto.pulseRate || null,
        respiratoryRate: dto.respiratoryRate || null,
        oxygenSaturation: dto.oxygenSaturation !== undefined ? dto.oxygenSaturation.toFixed(1) : null,
        weightKg: dto.weightKg !== undefined ? dto.weightKg.toFixed(2) : null,
        heightCm: dto.heightCm !== undefined ? dto.heightCm.toFixed(1) : null,
        bmi,
        notes: dto.notes || null,
      })
      .returning();

    return newVitals;
  }

  async findByPatient(patientId: string) {
    return this.databaseService.db
      .select()
      .from(vitalSigns)
      .where(eq(vitalSigns.patientId, patientId))
      .orderBy(desc(vitalSigns.recordedAt));
  }

  async findByAppointment(appointmentId: string) {
    const list = await this.databaseService.db
      .select()
      .from(vitalSigns)
      .where(eq(vitalSigns.appointmentId, appointmentId))
      .limit(1);

    if (list.length === 0) {
      throw new NotFoundException(`Vital signs for appointment ID ${appointmentId} not found`);
    }

    return list[0];
  }
}
