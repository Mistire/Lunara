import { pgTable, uuid, varchar, numeric, timestamp } from 'drizzle-orm/pg-core';
import { invoices } from './invoices';
import { users } from './users';
import { paymentMethodEnum } from './enums';

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  processedBy: uuid('processed_by').notNull().references(() => users.id),
  method: paymentMethodEnum('method').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  reference: varchar('reference', { length: 255 }),
  receiptNumber: varchar('receipt_number', { length: 30 }),
  paidAt: timestamp('paid_at').defaultNow().notNull(),
});
