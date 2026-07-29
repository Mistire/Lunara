import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { consultations } from './consultations';

export const soapNotes = pgTable('soap_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  consultationId: uuid('consultation_id').notNull().unique().references(() => consultations.id, { onDelete: 'cascade' }),
  subjective: text('subjective'),
  objective: text('objective'),
  assessment: text('assessment'),
  plan: text('plan'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
