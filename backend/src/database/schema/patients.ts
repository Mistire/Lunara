import { pgTable, uuid, varchar, date, text, timestamp } from 'drizzle-orm/pg-core';
import { clinics } from './clinics';
import { patientSexEnum, bloodGroupEnum } from './enums';

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  mrn: varchar('mrn', { length: 20 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  sex: patientSexEnum('sex').notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  bloodGroup: bloodGroupEnum('blood_group'),
  chronicConditions: text('chronic_conditions'),
  allergies: text('allergies'),
  emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  emergencyContactRel: varchar('emergency_contact_rel', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
