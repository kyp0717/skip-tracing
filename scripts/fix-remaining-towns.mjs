import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRemainingTowns() {
  console.log('Fixing remaining records with incorrect town data...\n');

  try {
    // Based on the docket numbers, these cases are from Bethel (DBD prefix)
    const updates = [
      {
        id: 378,
        docket: 'DBD-CV-23-6048087-S',
        currentAddress: '5 Deer Run',
        currentTown: 'Unit 82',
        newAddress: '5 Deer Run Unit 82',
        newTown: 'Bethel' // DBD indicates Danbury District which includes Bethel
      },
      {
        id: 391,
        docket: 'DBD-CV-24-6051442-S',
        currentAddress: '55 Lawrence Avenue',
        currentTown: 'Unit 2302',
        newAddress: '55 Lawrence Avenue Unit 2302',
        newTown: 'Bethel' // DBD indicates Danbury District which includes Bethel
      }
    ];

    for (const update of updates) {
      console.log(`Updating record ID: ${update.id}`);
      console.log(`Docket: ${update.docket}`);
      console.log(`Current: ${update.currentAddress}, ${update.currentTown}`);
      console.log(`New: ${update.newAddress}, ${update.newTown}`);

      const { error } = await supabase
        .from('case_detail')
        .update({
          address: update.newAddress,
          town: update.newTown
        })
        .eq('id', update.id);

      if (error) {
        console.error(`Error updating record ${update.id}:`, error);
      } else {
        console.log(`✓ Fixed record ${update.id}\n`);
      }
    }

    console.log('All remaining records fixed!');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
fixRemainingTowns();