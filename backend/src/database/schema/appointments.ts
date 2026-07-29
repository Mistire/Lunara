import { pgTable, uuid, integer, date, text, timestamp } from 'drizzle-orm/pg-core';
import { clinics } from './clinics';
import { patients } from './patients';
import { users } from './users';
import { timeSlots } from './schedules';
import { appointmentTypeEnum, appointmentStatusEnum } from './enums';

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  doctorId: uuid('doctor_id').notNull().references(() => users.id),
  slotId: uuid('slot_id').references(() => timeSlots.id, { onDelete: 'set null' }),
  bookedBy: uuid('booked_by').notNull().references(() => users.id),
  queueNumber: integer('queue_number').notNull(),
  type: appointmentTypeEnum('type').notNull().default('walk_in'),
  status: appointmentStatusEnum('status').notNull().default('scheduled'),
  scheduledDate: date('scheduled_date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
