import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { eq, and, or, ilike, desc, isNull } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { patients } from '../../database/schema/patients';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class PatientsService {
  constructor(private databaseService: DatabaseService) {}

  async create(dto: CreatePatientDto, currentUser: JwtPayload) {
    // We execute inside a database transaction to prevent race conditions during MRN generation
    return this.databaseService.db.transaction(async (tx) => {
      const currentYear = new Date().getFullYear();
      const prefix = `LUN-${currentYear}-`;

      // Get the last generated MRN for the current year
      const lastPatients = await tx
        .select({ mrn: patients.mrn })
        .from(patients)
        .where(ilike(patients.mrn, `${prefix}%`))
        .orderBy(desc(patients.mrn))
        .limit(1);

      let nextSequence = 1;
      if (lastPatients.length > 0) {
        const lastMrn = lastPatients[0].mrn;
        const parts = lastMrn.split('-');
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          nextSequence = lastSeq + 1;
        }
      }

      const nextMrn = `LUN-${currentYear}-${String(nextSequence).padStart(5, '0')}`;

      // Optional: Check if email/phone duplicate exists in same clinic (but MRN itself is globally unique)
      if (dto.email) {
        const existingEmail = await tx
          .select({ id: patients.id })
          .from(patients)
          .where(
            and(
              eq(patients.email, dto.email.toLowerCase().trim()),
              eq(patients.clinicId, currentUser.clinicId),
              isNull(patients.deletedAt),
            ),
          )
          .limit(1);

        if (existingEmail.length > 0) {
          throw new ConflictException('A patient with this email address already exists in this clinic');
        }
      }

      const [newPatient] = await tx
        .insert(patients)
        .values({
          clinicId: currentUser.clinicId,
          mrn: nextMrn,
          fullName: dto.fullName.trim(),
          dateOfBirth: dto.dateOfBirth,
          sex: dto.sex,
          phone: dto.phone?.trim(),
          email: dto.email?.toLowerCase().trim(),
          address: dto.address?.trim(),
          bloodGroup: dto.bloodGroup,
          chronicConditions: dto.chronicConditions?.trim(),
          allergies: dto.allergies?.trim(),
          emergencyContactName: dto.emergencyContactName?.trim(),
          emergencyContactPhone: dto.emergencyContactPhone?.trim(),
          emergencyContactRel: dto.emergencyContactRel?.trim(),
        })
        .returning();

      return newPatient;
    });
  }

  async findAll(currentUser: JwtPayload, search?: string) {
    let whereClause = and(
      eq(patients.clinicId, currentUser.clinicId),
      isNull(patients.deletedAt),
    );

    if (search) {
      const searchPattern = `%${search.trim()}%`;
      whereClause = and(
        whereClause,
        or(
          ilike(patients.fullName, searchPattern),
          ilike(patients.mrn, searchPattern),
          ilike(patients.phone, searchPattern),
        ),
      );
    }

    return this.databaseService.db
      .select()
      .from(patients)
      .where(whereClause)
      .orderBy(desc(patients.createdAt));
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const patientList = await this.databaseService.db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.id, id),
          eq(patients.clinicId, currentUser.clinicId),
          isNull(patients.deletedAt),
        ),
      )
      .limit(1);

    if (patientList.length === 0) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patientList[0];
  }

  async update(id: string, dto: UpdatePatientDto, currentUser: JwtPayload) {
    const patient = await this.findOne(id, currentUser);

    const updateData: Partial<typeof patients.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.fullName) updateData.fullName = dto.fullName.trim();
    if (dto.dateOfBirth) updateData.dateOfBirth = dto.dateOfBirth;
    if (dto.sex) updateData.sex = dto.sex;
    if (dto.phone !== undefined) updateData.phone = dto.phone?.trim();
    if (dto.email !== undefined) updateData.email = dto.email?.toLowerCase().trim();
    if (dto.address !== undefined) updateData.address = dto.address?.trim();
    if (dto.bloodGroup !== undefined) updateData.bloodGroup = dto.bloodGroup;
    if (dto.chronicConditions !== undefined) updateData.chronicConditions = dto.chronicConditions?.trim();
    if (dto.allergies !== undefined) updateData.allergies = dto.allergies?.trim();
    if (dto.emergencyContactName !== undefined) updateData.emergencyContactName = dto.emergencyContactName?.trim();
    if (dto.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = dto.emergencyContactPhone?.trim();
    if (dto.emergencyContactRel !== undefined) updateData.emergencyContactRel = dto.emergencyContactRel?.trim();

    // Check email uniqueness if modified
    if (dto.email && dto.email.toLowerCase().trim() !== patient.email) {
      const existingEmail = await this.databaseService.db
        .select({ id: patients.id })
        .from(patients)
        .where(
          and(
            eq(patients.email, dto.email.toLowerCase().trim()),
            eq(patients.clinicId, currentUser.clinicId),
            isNull(patients.deletedAt),
          ),
        )
        .limit(1);

      if (existingEmail.length > 0) {
        throw new ConflictException('A patient with this email address already exists in this clinic');
      }
    }

    const [updatedPatient] = await this.databaseService.db
      .update(patients)
      .set(updateData)
      .where(and(eq(patients.id, id), eq(patients.clinicId, currentUser.clinicId)))
      .returning();

    return updatedPatient;
  }

  async remove(id: string, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);

    const [deletedPatient] = await this.databaseService.db
      .update(patients)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(patients.id, id), eq(patients.clinicId, currentUser.clinicId)))
      .returning({
        id: patients.id,
        mrn: patients.mrn,
        deletedAt: patients.deletedAt,
      });

    return deletedPatient;
  }
}
