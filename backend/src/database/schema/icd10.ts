import { pgTable, uuid, varchar, text, boolean, timestamp, customType } from 'drizzle-orm/pg-core';
import { consultations } from './consultations';

// Custom type for PostgreSQL tsvector
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const icd10Codes = pgTable('icd10_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }),
  searchVector: tsvector('search_vector'),
});

export const consultationDiagnoses = pgTable('consultation_diagnoses', {
  id: uuid('id').primaryKey().defaultRandom(),
  consultationId: uuid('consultation_id').notNull().references(() => consultations.id, { onDelete: 'cascade' }),
  icd10CodeId: uuid('icd10_code_id').notNull().references(() => icd10Codes.id),
  isPrimary: boolean('is_primary').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
