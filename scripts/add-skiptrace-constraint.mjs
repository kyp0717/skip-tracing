import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function addSkipTraceConstraint() {
  try {
    console.log('Adding unique constraint to skiptrace table...');

    // Add unique constraint for defendant_id and phone_number
    await sql`
      ALTER TABLE skiptrace
      ADD CONSTRAINT unique_defendant_phone
      UNIQUE (defendant_id, phone_number);
    `;
    console.log('✓ Unique constraint added to skiptrace table');

    console.log('Migration completed successfully!');
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('✓ Constraint already exists, skipping...');
    } else {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  }
}

addSkipTraceConstraint();