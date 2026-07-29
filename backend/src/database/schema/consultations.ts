import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { appointments } from './appointments';
import { users } from './users';
import { patients } from './patients';
import { consultationStatusEnum } from './enums';

export const consultations = pgTable('consultations', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull().unique().references(() => appointments.id),
  doctorId: uuid('doctor_id').notNull().references(() => users.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  status: consultationStatusEnum('status').notNull().default('in_progress'),
  chiefComplaint: text('chief_complaint'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
