import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { eq, and, asc, isNull, count } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { appointments } from '../../database/schema/appointments';
import { patients } from '../../database/schema/patients';
import { users } from '../../database/schema/users';
import { timeSlots } from '../../database/schema/schedules';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { QueueGateway } from '../queue/queue.gateway';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly queueGateway: QueueGateway,
  ) {}

  async create(dto: CreateAppointmentDto, currentUser: JwtPayload) {
    return this.databaseService.db.transaction(async (tx) => {
      // 1. Verify patient exists in the clinic and is not deleted
      const patientCheck = await tx
        .select({ id: patients.id })
        .from(patients)
        .where(
          and(
            eq(patients.id, dto.patientId),
            eq(patients.clinicId, currentUser.clinicId),
            isNull(patients.deletedAt),
          ),
        )
        .limit(1);

      if (patientCheck.length === 0) {
        throw new NotFoundException(`Patient with ID ${dto.patientId} not found`);
      }

      // 2. Verify doctor exists in the clinic and has the 'doctor' role
      const doctorCheck = await tx
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(
          and(
            eq(users.id, dto.doctorId),
            eq(users.clinicId, currentUser.clinicId),
            eq(users.isActive, true),
          ),
        )
        .limit(1);

      if (doctorCheck.length === 0 || doctorCheck[0].role !== 'doctor') {
        throw new BadRequestException('Selected staff member is not a valid active doctor');
      }

      const bookingType = dto.type || 'walk_in';

      // 3. Handle slot reservation for scheduled appointments
      if (bookingType === 'scheduled') {
        if (!dto.slotId) {
          throw new BadRequestException('slotId is required for scheduled appointments');
        }

        const slotCheck = await tx
          .select()
          .from(timeSlots)
          .where(eq(timeSlots.id, dto.slotId))
          .limit(1);

        if (slotCheck.length === 0) {
          throw new NotFoundException(`Time slot with ID ${dto.slotId} not found`);
        }

        const slot = slotCheck[0];
        if (slot.doctorId !== dto.doctorId) {
          throw new BadRequestException('Selected time slot does not belong to the selected doctor');
        }
        if (slot.date !== dto.scheduledDate) {
          throw new BadRequestException('Selected time slot date does not match the scheduled date');
        }
        if (slot.isBooked) {
          throw new ConflictException('Selected time slot is already booked');
        }

        // Lock the time slot
        await tx
          .update(timeSlots)
          .set({ isBooked: true })
          .where(eq(timeSlots.id, dto.slotId));
      }

      // 4. Generate daily sequential queue number for the doctor
      const countRes = await tx
        .select({ count: count() })
        .from(appointments)
        .where(
          and(
            eq(appointments.doctorId, dto.doctorId),
            eq(appointments.scheduledDate, dto.scheduledDate),
            eq(appointments.clinicId, currentUser.clinicId),
          ),
        );

      const queueNumber = (countRes[0]?.count || 0) + 1;

      // 5. Insert appointment
      const [newAppt] = await tx
        .insert(appointments)
        .values({
          clinicId: currentUser.clinicId,
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          slotId: bookingType === 'scheduled' ? dto.slotId : null,
          bookedBy: currentUser.sub,
          queueNumber,
          type: bookingType,
          status: 'scheduled',
          scheduledDate: dto.scheduledDate,
          notes: dto.notes || null,
        })
        .returning();

      // 6. Broadcast live update via WebSocket gateway
      this.queueGateway.broadcastQueueUpdate(
        currentUser.clinicId,
        dto.doctorId,
        dto.scheduledDate,
      );

      return newAppt;
    });
  }

  async findAll(
    currentUser: JwtPayload,
    filters: { doctorId?: string; date?: string; status?: string; patientId?: string },
  ) {
    let whereClause = eq(appointments.clinicId, currentUser.clinicId);

    if (filters.doctorId) {
      whereClause = and(whereClause, eq(appointments.doctorId, filters.doctorId));
    }
    if (filters.date) {
      whereClause = and(whereClause, eq(appointments.scheduledDate, filters.date));
    }
    if (filters.status) {
      whereClause = and(whereClause, eq(appointments.status, filters.status as any));
    }
    if (filters.patientId) {
      whereClause = and(whereClause, eq(appointments.patientId, filters.patientId));
    }

    return this.databaseService.db
      .select({
        id: appointments.id,
        queueNumber: appointments.queueNumber,
        type: appointments.type,
        status: appointments.status,
        scheduledDate: appointments.scheduledDate,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        patient: {
          id: patients.id,
          fullName: patients.fullName,
          mrn: patients.mrn,
          sex: patients.sex,
          dateOfBirth: patients.dateOfBirth,
        },
        doctor: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(users, eq(appointments.doctorId, users.id))
      .where(whereClause)
      .orderBy(asc(appointments.queueNumber));
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const list = await this.databaseService.db
      .select({
        id: appointments.id,
        queueNumber: appointments.queueNumber,
        type: appointments.type,
        status: appointments.status,
        scheduledDate: appointments.scheduledDate,
        notes: appointments.notes,
        createdAt: appointments.createdAt,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        slotId: appointments.slotId,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.id, id),
          eq(appointments.clinicId, currentUser.clinicId),
        ),
      )
      .limit(1);

    if (list.length === 0) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return list[0];
  }

  async updateStatus(
    id: string,
    status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled',
    currentUser: JwtPayload,
  ) {
    return this.databaseService.db.transaction(async (tx) => {
      const apptCheck = await tx
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.id, id),
            eq(appointments.clinicId, currentUser.clinicId),
          ),
        )
        .limit(1);

      if (apptCheck.length === 0) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      const appt = apptCheck[0];

      // If appointment is cancelled, release the booked time slot
      if (status === 'cancelled' && appt.slotId) {
        await tx
          .update(timeSlots)
          .set({ isBooked: false })
          .where(eq(timeSlots.id, appt.slotId));
      }

      const [updated] = await tx
        .update(appointments)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, id))
        .returning();

      // Trigger WebSockets notification so queues sync
      this.queueGateway.broadcastQueueUpdate(
        currentUser.clinicId,
        appt.doctorId,
        appt.scheduledDate,
      );

      return updated;
    });
  }
}
