import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixInvalidTowns() {
  console.log('Fixing records with invalid towns...\n');

  try {
    // Get all valid CT towns
    const { data: validTowns, error: townError } = await supabase
      .from('ct_towns')
      .select('town');

    if (townError) {
      console.error('Error fetching ct_towns:', townError);
      return;
    }

    // Create a set of valid town names (case-insensitive)
    const validTownSet = new Set(validTowns.map(t => t.town.toLowerCase()));
    console.log(`Loaded ${validTowns.length} valid CT towns\n`);

    // Get all case_detail records
    const { data: cases, error } = await supabase
      .from('case_detail')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching case details:', error);
      return;
    }

    console.log(`Checking ${cases.length} case records...\n`);

    for (const record of cases) {
      let needsUpdate = false;
      let newAddress = record.address;
      let newTown = record.town;

      // Handle aka/a.k.a in address or town
      if (record.address && record.address.toLowerCase().includes('aka')) {
        // Remove aka portion from address
        newAddress = record.address.replace(/\s*(aka|a\/k\/a|a\.k\.a)\s+.*/i, '').trim();
        needsUpdate = true;
        console.log(`ID ${record.id}: Removing 'aka' from address`);
      }

      // Check if town contains aka
      if (record.town && record.town.toLowerCase().includes('a')) {
        if (record.town.toLowerCase().includes('aka') ||
            record.town.toLowerCase().includes('a/k/a') ||
            record.town.toLowerCase().includes('a.k.a')) {

          // Extract the actual address from the aka string if it exists
          const akaMatch = record.town.match(/(aka|a\/k\/a|a\.k\.a)\s+(.+)/i);
          if (akaMatch && akaMatch[2]) {
            // Append the aka address to the main address
            const akaAddress = akaMatch[2].trim();
            newAddress = `${newAddress} (aka ${akaAddress})`;
          }

          // Determine town from docket number prefix
          if (record.docket_number.startsWith('DBD-')) {
            // Danbury District - likely Bethel based on our data
            newTown = 'Bethel';
          } else {
            // Try to find a default or leave null
            newTown = null;
          }
          needsUpdate = true;
          console.log(`ID ${record.id}: Town contains 'aka', setting to ${newTown || 'null'}`);
        }
      }

      // Validate town exists in ct_towns
      if (newTown && !validTownSet.has(newTown.toLowerCase())) {
        console.log(`ID ${record.id}: Town '${newTown}' not found in ct_towns, setting to null`);
        newTown = null;
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`Updating record ${record.id}:`);
        console.log(`  Old address: ${record.address}`);
        console.log(`  New address: ${newAddress}`);
        console.log(`  Old town: ${record.town}`);
        console.log(`  New town: ${newTown}`);

        const { error: updateError } = await supabase
          .from('case_detail')
          .update({
            address: newAddress,
            town: newTown
          })
          .eq('id', record.id);

        if (updateError) {
          console.error(`Error updating record ${record.id}:`, updateError);
        } else {
          console.log(`✓ Fixed record ${record.id}\n`);
        }
      }
    }

    console.log('Fix complete!');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
fixInvalidTowns();