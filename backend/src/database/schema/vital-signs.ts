import { pgTable, uuid, varchar, numeric, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { patients } from './patients';
import { users } from './users';

export const vitalSigns = pgTable('vital_signs', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  appointmentId: uuid('appointment_id'),
  recordedBy: uuid('recorded_by').notNull().references(() => users.id),
  bloodPressure: varchar('blood_pressure', { length: 20 }),
  temperature: numeric('temperature', { precision: 4, scale: 1 }),
  pulseRate: integer('pulse_rate'),
  respiratoryRate: integer('respiratory_rate'),
  oxygenSaturation: numeric('oxygen_saturation', { precision: 4, scale: 1 }),
  weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
  heightCm: numeric('height_cm', { precision: 5, scale: 1 }),
  bmi: numeric('bmi', { precision: 4, scale: 2 }),
  notes: text('notes'),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});
