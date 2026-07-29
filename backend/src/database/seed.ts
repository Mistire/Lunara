import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { eq, sql } from 'drizzle-orm';
import { clinics } from './schema/clinics';
import { users } from './schema/users';
import { icd10Codes } from './schema/icd10';

dotenv.config();

const sampleIcd10Data = [
  { code: 'J00', description: 'Acute nasopharyngitis [common cold]', category: 'Respiratory system' },
  { code: 'J02.9', description: 'Acute pharyngitis, unspecified', category: 'Respiratory system' },
  { code: 'J03.9', description: 'Acute tonsillitis, unspecified', category: 'Respiratory system' },
  { code: 'J18.9', description: 'Pneumonia, unspecified organism', category: 'Respiratory system' },
  { code: 'J18.0', description: 'Bronchopneumonia, unspecified organism', category: 'Respiratory system' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', category: 'Respiratory system' },
  { code: 'A09', description: 'Infectious gastroenteritis and colitis, unspecified', category: 'Infectious diseases' },
  { code: 'A01.0', description: 'Typhoid fever', category: 'Infectious diseases' },
  { code: 'B54', description: 'Unspecified malaria', category: 'Infectious diseases' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine diseases' },
  { code: 'I10', description: 'Essential (primary) hypertension', category: 'Circulatory system' },
  { code: 'K29.7', description: 'Gastritis, unspecified', category: 'Digestive system' },
  { code: 'M54.5', description: 'Low back pain', category: 'Musculoskeletal system' },
  { code: 'R50.9', description: 'Fever, unspecified', category: 'Symptoms & signs' },
  { code: 'R51', description: 'Headache', category: 'Symptoms & signs' },
  { code: 'R05', description: 'Cough', category: 'Symptoms & signs' },
  { code: 'B34.9', description: 'Viral infection, unspecified', category: 'Infectious diseases' },
];

async function seed() {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/lunara_db';

  console.log('🌱 Seeding database...');
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // 1. Seed or get Clinic
    let [clinic] = await db.select().from(clinics).where(eq(clinics.name, 'Sof Omar Health Center')).limit(1);

    if (!clinic) {
      [clinic] = await db
        .insert(clinics)
        .values({
          name: 'Sof Omar Health Center',
          address: 'Bole Road, Addis Ababa, Ethiopia',
          phone: '+251911000000',
          email: 'info@sofomarhealth.et',
        })
        .returning();
      console.log('✅ Created Clinic:', clinic.name);
    } else {
      console.log('ℹ️ Clinic already exists:', clinic.name);
    }

    // 2. Seed Default Staff Accounts
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    const staffAccounts = [
      { fullName: 'Admin User', email: 'admin@lunara.et', role: 'admin' as const },
      { fullName: 'Sara Receptionist', email: 'receptionist@lunara.et', role: 'receptionist' as const },
      { fullName: 'Sister Bethlehem Nurse', email: 'nurse@lunara.et', role: 'nurse' as const },
      { fullName: 'Dr. Abebe Doctor', email: 'doctor@lunara.et', role: 'doctor' as const },
      { fullName: 'Samuel Lab Tech', email: 'lab@lunara.et', role: 'lab_technician' as const },
      { fullName: 'Tigist Cashier', email: 'cashier@lunara.et', role: 'cashier' as const },
    ];

    for (const staff of staffAccounts) {
      const [existing] = await db.select().from(users).where(eq(users.email, staff.email)).limit(1);
      if (!existing) {
        await db.insert(users).values({
          clinicId: clinic.id,
          fullName: staff.fullName,
          email: staff.email,
          passwordHash: defaultPasswordHash,
          role: staff.role,
          isActive: true,
        });
        console.log(`✅ Created ${staff.role} user: ${staff.email}`);
      }
    }

    // 3. Setup Full-Text Search Vector Trigger for ICD-10 if not exists
    await client`
      CREATE OR REPLACE FUNCTION update_icd10_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', COALESCE(NEW.code, '') || ' ' || COALESCE(NEW.description, ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await client`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'icd10_search_vector_update') THEN
          CREATE TRIGGER icd10_search_vector_update
            BEFORE INSERT OR UPDATE ON icd10_codes
            FOR EACH ROW EXECUTE FUNCTION update_icd10_search_vector();
        END IF;
      END $$;
    `;

    // 4. Seed ICD-10 Dataset
    for (const item of sampleIcd10Data) {
      const [existingCode] = await db.select().from(icd10Codes).where(eq(icd10Codes.code, item.code)).limit(1);
      if (!existingCode) {
        await db.insert(icd10Codes).values({
          code: item.code,
          description: item.description,
          category: item.category,
        });
      }
    }

    // Update existing search vectors
    await client`
      UPDATE icd10_codes 
      SET search_vector = to_tsvector('english', COALESCE(code, '') || ' ' || COALESCE(description, ''))
      WHERE search_vector IS NULL;
    `;

    console.log(`✅ Seeded ${sampleIcd10Data.length} ICD-10 diagnostic codes!`);
    console.log('🎉 Seeding complete successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await client.end();
  }
}

seed();
