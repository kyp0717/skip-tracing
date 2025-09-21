import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const docketNumber = process.argv[2] || 'MMX-CV-24-6042001-S';

async function clearSkipTrace() {
  try {
    console.log(`Clearing skip trace records for docket: ${docketNumber}`);

    const result = await sql`
      DELETE FROM skiptrace
      WHERE docket_number = ${docketNumber}
      RETURNING *;
    `;

    console.log(`✓ Deleted ${result.rowCount} skip trace records`);

    if (result.rows.length > 0) {
      console.log('Deleted records:', result.rows);
    }

  } catch (error) {
    console.error('Error clearing skip trace records:', error);
    process.exit(1);
  }
}

clearSkipTrace();