import { pgTable, uuid, varchar, numeric, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { clinics } from './clinics';
import { patients } from './patients';
import { consultations } from './consultations';
import { invoiceStatusEnum, invoiceItemTypeEnum } from './enums';

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id),
  patientId: uuid('patient_id').notNull().references(() => patients.id),
  consultationId: uuid('consultation_id').references(() => consultations.id, { onDelete: 'set null' }),
  invoiceNumber: varchar('invoice_number', { length: 30 }).notNull().unique(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  dueAt: timestamp('due_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: varchar('description', { length: 255 }).notNull(),
  type: invoiceItemTypeEnum('type').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  refId: uuid('ref_id'),
});
