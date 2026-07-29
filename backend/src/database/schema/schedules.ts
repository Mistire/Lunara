import { pgTable, uuid, integer, time, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const doctorSchedules = pgTable('doctor_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  doctorId: uuid('doctor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  slotDurationMinutes: integer('slot_duration_minutes').notNull().default(30),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const timeSlots = pgTable('time_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id').notNull().references(() => doctorSchedules.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id').notNull().references(() => users.id),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  isBooked: boolean('is_booked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
