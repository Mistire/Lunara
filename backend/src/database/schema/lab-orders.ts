import { pgTable, uuid, varchar, numeric, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { consultations } from './consultations';
import { users } from './users';
import { patients } from './patients';
import { labOrderStatusEnum, labUrgencyEnum, labItemStatusEnum } from './enums';

export const labOrders = pgTable('lab_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  consultationId: uuid('consultation_id').notNull().references(() => consultations.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id').notNull().references(() => users.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  status: labOrderStatusEnum('status').notNull().default('pending'),
  urgency: labUrgencyEnum('urgency').notNull().default('routine'),
  notes: text('notes'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const labOrderItems = pgTable('lab_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  labOrderId: uuid('lab_order_id').notNull().references(() => labOrders.id, { onDelete: 'cascade' }),
  testName: varchar('test_name', { length: 255 }).notNull(),
  testCode: varchar('test_code', { length: 50 }),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  status: labItemStatusEnum('status').notNull().default('pending'),
});

export const labResults = pgTable('lab_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  labOrderId: uuid('lab_order_id').notNull().references(() => labOrders.id, { onDelete: 'cascade' }),
  enteredBy: uuid('entered_by').notNull().references(() => users.id),
  resultData: jsonb('result_data'),
  interpretation: text('interpretation'),
  fileUrl: text('file_url'),
  pdfUrl: text('pdf_url'),
  enteredAt: timestamp('entered_at').defaultNow().notNull(),
});
