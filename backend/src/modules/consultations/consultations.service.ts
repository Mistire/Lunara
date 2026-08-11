import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { consultations } from '../../database/schema/consultations';
import { soapNotes } from '../../database/schema/soap-notes';
import { consultationDiagnoses, icd10Codes } from '../../database/schema/icd10';
import { appointments } from '../../database/schema/appointments';
import { patients } from '../../database/schema/patients';
import { timeSlots } from '../../database/schema/schedules';
import { users } from '../../database/schema/users';
import { QueueGateway } from '../queue/queue.gateway';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { UpsertSoapNotesDto } from './dto/upsert-soap-notes.dto';
import { AddDiagnosisDto } from './dto/add-diagnosis.dto';

@Injectable()
export class ConsultationsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly queueGateway: QueueGateway,
  ) {}

  async startConsultation(dto: CreateConsultationDto, currentUser: JwtPayload) {
    // 1. Verify appointment exists in the clinic
    const apptRes = await this.databaseService.db
      .select({
        id: appointments.id,
        doctorId: appointments.doctorId,
        patientId: appointments.patientId,
        status: appointments.status,
        scheduledDate: appointments.scheduledDate,
        clinicId: appointments.clinicId,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.id, dto.appointmentId),
          eq(appointments.clinicId, currentUser.clinicId),
        ),
      )
      .limit(1);

    if (apptRes.length === 0) {
      throw new NotFoundException(`Appointment with ID ${dto.appointmentId} not found`);
    }

    const appt = apptRes[0];

    // 2. Doctor ownership check
    if (currentUser.role !== 'admin' && appt.doctorId !== currentUser.sub) {
      throw new ForbiddenException('You can only start consultations for appointments assigned to you');
    }

    // 3. Status checks
    if (appt.status !== 'checked_in') {
      throw new BadRequestException(`Consultation can only be started for checked-in appointments. Current status is ${appt.status}`);
    }

    // 4. Verify duplicate consultation does not exist
    const existingConsult = await this.databaseService.db
      .select({ id: consultations.id })
      .from(consultations)
      .where(eq(consultations.appointmentId, dto.appointmentId))
      .limit(1);

    if (existingConsult.length > 0) {
      throw new BadRequestException('Consultation already exists for this appointment');
    }

    // 5. Insert consultation and transition appointment status in a transaction
    return this.databaseService.db.transaction(async (tx) => {
      const [newConsult] = await tx
        .insert(consultations)
        .values({
          appointmentId: dto.appointmentId,
          doctorId: appt.doctorId,
          patientId: appt.patientId,
          status: 'in_progress',
          chiefComplaint: dto.chiefComplaint || null,
          startedAt: new Date(),
        })
        .returning();

      await tx
        .update(appointments)
        .set({
          status: 'in_progress',
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, dto.appointmentId));

      // Broadcast queue update via websocket
      this.queueGateway.broadcastQueueUpdate(
        currentUser.clinicId,
        appt.doctorId,
        appt.scheduledDate,
      );

      return newConsult;
    });
  }

  async updateConsultation(id: string, dto: UpdateConsultationDto, currentUser: JwtPayload) {
    // 1. Verify consultation exists and belongs to the clinic
    const consultRes = await this.databaseService.db
      .select({
        id: consultations.id,
        appointmentId: consultations.appointmentId,
        doctorId: consultations.doctorId,
        patientId: consultations.patientId,
        status: consultations.status,
      })
      .from(consultations)
      .innerJoin(appointments, eq(consultations.appointmentId, appointments.id))
      .where(
        and(
          eq(consultations.id, id),
          eq(appointments.clinicId, currentUser.clinicId),
        ),
      )
      .limit(1);

    if (consultRes.length === 0) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    const consult = consultRes[0];

    // 2. Doctor ownership check
    if (currentUser.role !== 'admin' && consult.doctorId !== currentUser.sub) {
      throw new ForbiddenException('You are not authorized to update this consultation');
    }

    // 3. Status checks: cannot update completed/cancelled consultation status
    if (dto.status && (consult.status === 'completed' || consult.status === 'cancelled')) {
      throw new BadRequestException(`Completed or cancelled consultations cannot be modified`);
    }

    return this.databaseService.db.transaction(async (tx) => {
      const updates: Partial<typeof consultations.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (dto.chiefComplaint !== undefined) {
        updates.chiefComplaint = dto.chiefComplaint;
      }

      if (dto.status !== undefined) {
        updates.status = dto.status;
        if (dto.status === 'completed') {
          updates.completedAt = new Date();
        }
      }

      const [updatedConsult] = await tx
        .update(consultations)
        .set(updates)
        .where(eq(consultations.id, id))
        .returning();

      if (dto.status) {
        // Also update the linked appointment status
        await tx
          .update(appointments)
          .set({
            status: dto.status,
            updatedAt: new Date(),
          })
          .where(eq(appointments.id, consult.appointmentId));

        // Fetch appointment to check for time slot release
        const apptRes = await tx
          .select({ slotId: appointments.slotId, scheduledDate: appointments.scheduledDate, doctorId: appointments.doctorId })
          .from(appointments)
          .where(eq(appointments.id, consult.appointmentId))
          .limit(1);

        if (apptRes.length > 0) {
          const appt = apptRes[0];
          if (dto.status === 'cancelled' && appt.slotId) {
            await tx
              .update(timeSlots)
              .set({ isBooked: false })
              .where(eq(timeSlots.id, appt.slotId));
          }

          // Broadcast queue update
          this.queueGateway.broadcastQueueUpdate(
            currentUser.clinicId,
            appt.doctorId,
            appt.scheduledDate,
          );
        }
      }

      return updatedConsult;
    });
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const consultList = await this.databaseService.db
      .select({
        id: consultations.id,
        appointmentId: consultations.appointmentId,
        doctorId: consultations.doctorId,
        patientId: consultations.patientId,
        status: consultations.status,
        chiefComplaint: consultations.chiefComplaint,
        startedAt: consultations.startedAt,
        completedAt: consultations.completedAt,
        createdAt: consultations.createdAt,
        updatedAt: consultations.updatedAt,
        patient: {
          id: patients.id,
          fullName: patients.fullName,
          mrn: patients.mrn,
          dateOfBirth: patients.dateOfBirth,
          sex: patients.sex,
        },
        doctor: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(consultations)
      .innerJoin(appointments, eq(consultations.appointmentId, appointments.id))
      .innerJoin(patients, eq(consultations.patientId, patients.id))
      .innerJoin(users, eq(consultations.doctorId, users.id))
      .where(
        and(
          eq(consultations.id, id),
          eq(appointments.clinicId, currentUser.clinicId),
        ),
      )
      .limit(1);

    if (consultList.length === 0) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    return consultList[0];
  }

  async findPatientHistory(patientId: string, currentUser: JwtPayload) {
    return this.databaseService.db
      .select({
        id: consultations.id,
        appointmentId: consultations.appointmentId,
        doctorId: consultations.doctorId,
        patientId: consultations.patientId,
        status: consultations.status,
        chiefComplaint: consultations.chiefComplaint,
        startedAt: consultations.startedAt,
        completedAt: consultations.completedAt,
        createdAt: consultations.createdAt,
        updatedAt: consultations.updatedAt,
        doctor: {
          id: users.id,
          fullName: users.fullName,
        },
      })
      .from(consultations)
      .innerJoin(users, eq(consultations.doctorId, users.id))
      .innerJoin(patients, eq(consultations.patientId, patients.id))
      .where(
        and(
          eq(consultations.patientId, patientId),
          eq(patients.clinicId, currentUser.clinicId),
        ),
      )
      .orderBy(desc(consultations.startedAt));
  }

  async getSoapNotes(consultationId: string, currentUser: JwtPayload) {
    const consultCheck = await this.databaseService.db
      .select({ id: consultations.id })
      .from(consultations)
      .innerJoin(appointments, eq(consultations.appointmentId, appointments.id))
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(appointments.clinicId, currentUser.clinicId),
        ),
      )
      .limit(1);

    if (consultCheck.length === 0) {
      throw new NotFoundException(`Consultation with ID ${consultationId} not found`);
    }

    const notes = await this.databaseService.db
      .select()
      .from(soapNotes)
      .where(eq(soapNotes.consultationId, consultationId))
      .limit(1);

    return notes[0] || null;
  }

  async upsertSoapNotes(consultationId: string, dto: UpsertSoapNotesDto, currentUser: JwtPayload) {
    const consultCheck = await this.databaseService.db
      .select({
        id: consultations.id,
        doctorId: consultations.doctorId,
        status: consultations.status,
      })
      .from(consultations)
      .innerJoin(appointments, eq(consultations.appointmentId, appointments.id))
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(appointments.clinicId, currentUser.clinicId),
        ),
      )
      .limit(1);

    if (consultCheck.length === 0) {
      throw new NotFoundException(`Consultation with ID ${consultationId} not found`);
    }

    const consult = consultCheck[0];

    if (currentUser.role !== 'admin' && consult.doctorId !== currentUser.sub) {
      throw new ForbiddenException('You are not authorized to manage SOAP notes for this consultation');
    }

    if (consult.status !== 'in_progress') {
      throw new BadRequestException('SOAP notes can only be modified for active (in_progress) consultations');
    }

    const [savedNotes] = await this.databaseService.db
      .insert(soapNotes)
      .values({
        consultationId,
        subjective: dto.subjective || null,
        objective: dto.objective || null,
        assessment: dto.assessment || null,
        plan: dto.plan || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: soapNotes.consultationId,
        set: {
          subjective: dto.subjective !== undefined ? dto.subjective : undefined,
          objective: dto.objective !== undefined ? dto.objective : undefined,
          assessment: dto.assessment !== undefined ? dto.assessment : undefined,
          plan: dto.plan !== undefined ? dto.plan : undefined,
          updatedAt: new Date(),
        },
      })
      .returning();

    return savedNotes;
  }

  async addDiagnosis(consultationId: string, dto: AddDiagnosisDto, currentUser: JwtPayload) {
    const consultCheck = await this.databaseService.db
      .select({
        id: consultations.id,
        doctorId: consultations.doctorId,
        status: consultations.status,
      })
      .from(consultations)
      .innerJoin(appointments, eq(consultations.appointmentId, appointments.id))
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(appointments.clinicId, currentUser.clinicId),
        ),
      )
      .limit(1);

    if (consultCheck.length === 0) {
      throw new NotFoundException(`Consultation with ID ${consultationId} not found`);
    }

    const consult = consultCheck[0];

    if (currentUser.role !== 'admin' && consult.doctorId !== currentUser.sub) {
      throw new ForbiddenException('You are not authorized to manage diagnoses for this consultation');
    }

    if (consult.status !== 'in_progress') {
      throw new BadRequestException('Diagnoses can only be added during active consultations');
    }

    // Verify ICD-10 code exists
    const icdRes = await this.databaseService.db
      .select({ id: icd10Codes.id })
      .from(icd10Codes)
      .where(eq(icd10Codes.id, dto.icd10CodeId))
      .limit(1);

    if (icdRes.length === 0) {
      throw new NotFoundException(`ICD-10 Code with ID ${dto.icd10CodeId} not found`);
    }

    return this.databaseService.db.transaction(async (tx) => {
      const isPrimary = dto.isPrimary || false;

      if (isPrimary) {
        // Reset other diagnoses for this consultation to secondary
        await tx
          .update(consultationDiagnoses)
          .set({ isPrimary: false })
          .where(eq(consultationDiagnoses.consultationId, consultationId));
      }

      // Check if this ICD-10 code is already associated with this consultation
      const existingDiag = await tx
        .select({ id: consultationDiagnoses.id })
        .from(consultationDiagnoses)
        .where(
          and(
            eq(consultationDiagnoses.consultationId, consultationId),
            eq(consultationDiagnoses.icd10CodeId, dto.icd10CodeId),
          ),
        )
        .limit(1);

      if (existingDiag.length > 0) {
        const [updatedDiag] = await tx
          .update(consultationDiagnoses)
          .set({
            isPrimary,
            notes: dto.notes !== undefined ? dto.notes : undefined,
          })
          .where(eq(consultationDiagnoses.id, existingDiag[0].id))
          .returning();
        return updatedDiag;
      }

      const [newDiag] = await tx
        .insert(consultationDiagnoses)
        .values({
          consultationId,
          icd10CodeId: dto.icd10CodeId,
          isPrimary,
          notes: dto.notes || null,
        })
        .returning();

      return newDiag;
    });
  }

  async getDiagnoses(consultationId: string, currentUser: JwtPayload) {
    const consultCheck = await this.databaseService.db
      .select({ id: consultations.id })
      .from(consultations)
      .innerJoin(appointments, eq(consultations.appointmentId, appointments.id))
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(appointments.clinicId, currentUser.clinicId),
        ),
      )
      .limit(1);

    if (consultCheck.length === 0) {
      throw new NotFoundException(`Consultation with ID ${consultationId} not found`);
    }

    return this.databaseService.db
      .select({
        id: consultationDiagnoses.id,
        consultationId: consultationDiagnoses.consultationId,
        icd10CodeId: consultationDiagnoses.icd10CodeId,
        isPrimary: consultationDiagnoses.isPrimary,
        notes: consultationDiagnoses.notes,
        createdAt: consultationDiagnoses.createdAt,
        icd10Code: {
          id: icd10Codes.id,
          code: icd10Codes.code,
          description: icd10Codes.description,
        },
      })
      .from(consultationDiagnoses)
      .innerJoin(icd10Codes, eq(consultationDiagnoses.icd10CodeId, icd10Codes.id))
      .where(eq(consultationDiagnoses.consultationId, consultationId));
  }

  async removeDiagnosis(consultationId: string, diagnosisId: string, currentUser: JwtPayload) {
    const consultCheck = await this.databaseService.db
      .select({
        id: consultations.id,
        doctorId: consultations.doctorId,
        status: consultations.status,
      })
      .from(consultations)
      .innerJoin(appointments, eq(consultations.appointmentId, appointments.id))
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(appointments.clinicId, currentUser.clinicId),
        ),
      )
      .limit(1);

    if (consultCheck.length === 0) {
      throw new NotFoundException(`Consultation with ID ${consultationId} not found`);
    }

    const consult = consultCheck[0];

    if (currentUser.role !== 'admin' && consult.doctorId !== currentUser.sub) {
      throw new ForbiddenException('You are not authorized to manage diagnoses for this consultation');
    }

    if (consult.status !== 'in_progress') {
      throw new BadRequestException('Diagnoses can only be removed during active consultations');
    }

    const diagCheck = await this.databaseService.db
      .select({ id: consultationDiagnoses.id })
      .from(consultationDiagnoses)
      .where(
        and(
          eq(consultationDiagnoses.id, diagnosisId),
          eq(consultationDiagnoses.consultationId, consultationId),
        ),
      )
      .limit(1);

    if (diagCheck.length === 0) {
      throw new NotFoundException(`Diagnosis association with ID ${diagnosisId} not found for this consultation`);
    }

    await this.databaseService.db
      .delete(consultationDiagnoses)
      .where(eq(consultationDiagnoses.id, diagnosisId));

    return { success: true };
  }
}
