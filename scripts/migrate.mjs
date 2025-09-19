import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createTables() {
  try {
    console.log('Creating database tables...');

    // Create cases table
    await sql`
      CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        case_name VARCHAR(255) NOT NULL,
        docket_number VARCHAR(100) UNIQUE NOT NULL,
        docket_url TEXT,
        town VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✓ Cases table created');

    // Create defendants table
    await sql`
      CREATE TABLE IF NOT EXISTS defendants (
        id SERIAL PRIMARY KEY,
        docket_number VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        town VARCHAR(100),
        state VARCHAR(2),
        zip VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(docket_number, name),
        CONSTRAINT fk_docket_number
          FOREIGN KEY(docket_number)
          REFERENCES cases(docket_number)
          ON DELETE CASCADE
      );
    `;
    console.log('✓ Defendants table created');

    // Create skiptrace table
    await sql`
      CREATE TABLE IF NOT EXISTS skiptrace (
        id SERIAL PRIMARY KEY,
        defendant_id INTEGER REFERENCES defendants(id) ON DELETE CASCADE,
        phone_number VARCHAR(20),
        phone_type VARCHAR(50),
        source VARCHAR(20) CHECK (source IN ('sandbox', 'production')),
        api_response JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('✓ Skiptrace table created');

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_docket_number ON cases(docket_number);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_defendants_docket ON defendants(docket_number);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_skiptrace_defendant ON skiptrace(defendant_id);`;
    console.log('✓ Indexes created');

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

createTables();