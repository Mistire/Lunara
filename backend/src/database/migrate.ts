import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/lunara_db';

  console.log('🔄 Connecting to PostgreSQL database for migrations...');
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('🚀 Running Drizzle migrations...');
  try {
    await migrate(db, { migrationsFolder: './src/database/migrations' });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();
