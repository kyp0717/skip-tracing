import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCTTowns() {
  console.log('Checking ct_towns table...\n');

  try {
    // First check table structure
    const { data: towns, error, count } = await supabase
      .from('ct_towns')
      .select('*', { count: 'exact' })
      .limit(10);

    if (error) {
      console.error('Error fetching ct_towns:', error);
      return;
    }

    console.log(`Total towns in ct_towns table: ${count}`);

    // Check table structure
    if (towns && towns.length > 0) {
      console.log('\nTable columns:', Object.keys(towns[0]));
      console.log('\nSample towns:');
      towns.forEach(town => {
        // Display whatever columns exist
        console.log(`  -`, JSON.stringify(town));
      });
    }

    // Try to figure out the correct column name for town
    let townColumn = null;
    if (towns && towns.length > 0) {
      const cols = Object.keys(towns[0]);
      townColumn = cols.find(col => col.toLowerCase().includes('town') || col.toLowerCase().includes('name')) || cols[0];
      console.log(`\nUsing column '${townColumn}' for town names`);

      // Check if Bethel exists
      if (townColumn) {
        const bethel = towns.find(t => t[townColumn] && t[townColumn].toLowerCase().includes('bethel'));
        if (bethel) {
          console.log('\n✅ Bethel found in ct_towns table:', bethel[townColumn]);
        } else {
          console.log('\n❌ Bethel NOT found in sample data');
        }
      }
    }

    // Get the problematic docket numbers and check their towns
    const dockets = ['DBD-CV-25-6053956-S', 'DBD-CV-25-6055047-S'];

    console.log('\nChecking case details for problematic records:');
    const { data: cases } = await supabase
      .from('case_detail')
      .select('*')
      .in('docket_number', dockets);

    for (const c of cases || []) {
      console.log(`\nDocket: ${c.docket_number}`);
      console.log(`Current Address: ${c.address}`);
      console.log(`Current Town: ${c.town}`);

      // These are Danbury District (DBD) cases, likely Bethel
      console.log('Suggested Town: Bethel (based on DBD district)');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
checkCTTowns();