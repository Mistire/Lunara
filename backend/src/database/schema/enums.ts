import { pgEnum } from 'drizzle-orm/pg-core';

// User roles
export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'receptionist',
  'nurse',
  'doctor',
  'lab_technician',
  'cashier',
]);

// Patient sex
export const patientSexEnum = pgEnum('patient_sex', ['male', 'female', 'other']);

// Blood group
export const bloodGroupEnum = pgEnum('blood_group', [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
]);

// Appointment type
export const appointmentTypeEnum = pgEnum('appointment_type', ['walk_in', 'scheduled']);

// Appointment status
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'scheduled',
  'checked_in',
  'in_progress',
  'completed',
  'no_show',
  'cancelled',
]);

// Consultation status
export const consultationStatusEnum = pgEnum('consultation_status', [
  'in_progress',
  'completed',
  'cancelled',
]);

// Lab order status
export const labOrderStatusEnum = pgEnum('lab_order_status', [
  'pending',
  'sample_collected',
  'processing',
  'completed',
  'cancelled',
]);

// Lab order item status
export const labItemStatusEnum = pgEnum('lab_item_status', [
  'pending',
  'completed',
  'cancelled',
]);

// Lab urgency
export const labUrgencyEnum = pgEnum('lab_urgency', ['routine', 'urgent', 'stat']);

// Invoice status
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'pending',
  'partial',
  'paid',
  'cancelled',
]);

// Invoice item type
export const invoiceItemTypeEnum = pgEnum('invoice_item_type', [
  'consultation',
  'lab_test',
  'procedure',
  'supply',
]);

// Payment method
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'telebirr',
  'cbe_birr',
]);
