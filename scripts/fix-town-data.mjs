import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeAndFixTownData() {
  console.log('Analyzing case_detail table for incorrect town data...\n');

  try {
    // Get all case_detail records
    const { data: cases, error } = await supabase
      .from('case_detail')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching case details:', error);
      return;
    }

    console.log(`Total records: ${cases.length}\n`);

    // Pattern to detect apartment/unit numbers
    const apartmentPattern = /^(APT|APARTMENT|UNIT|SUITE|STE|#)\s*[\w\d-]+$/i;

    // Find records with incorrect town data
    const incorrectRecords = cases.filter(record => {
      if (!record.town) return false;
      return apartmentPattern.test(record.town.trim());
    });

    console.log(`Found ${incorrectRecords.length} records with incorrect town data:\n`);

    // Display and fix each incorrect record
    for (const record of incorrectRecords) {
      console.log(`ID: ${record.id}`);
      console.log(`Docket: ${record.docket_number}`);
      console.log(`Address: ${record.address}`);
      console.log(`Current Town (incorrect): ${record.town}`);

      // The apartment/unit should be appended to the address
      const updatedAddress = record.address ?
        `${record.address} ${record.town}` :
        record.town;

      // Determine the correct town based on the pattern from other records
      // or from the scraping context
      let correctTown = null;

      // Look for other records with the same street to infer the town
      const streetMatch = record.address?.match(/(\d+\s+[\w\s]+(?:Road|Rd|Street|St|Drive|Dr|Lane|Ln|Avenue|Ave|Court|Ct|Place|Pl|Circle|Cir|Way|Boulevard|Blvd))/i);
      if (streetMatch) {
        const similarAddress = cases.find(c =>
          c.id !== record.id &&
          c.address?.includes(streetMatch[1].split(/\s+/).slice(1).join(' ')) &&
          c.town &&
          !apartmentPattern.test(c.town)
        );

        if (similarAddress) {
          correctTown = similarAddress.town;
        }
      }

      // If we couldn't determine the town, we'll need to set it based on the case lookup
      // For now, we'll check if the case was scraped from a specific town
      if (!correctTown) {
        // Default based on common patterns in the data
        // Most cases seem to be from Andover or Bethel based on your testing
        console.log(`Could not automatically determine town for record ${record.id}`);
        console.log(`Manual review needed\n`);
        continue;
      }

      console.log(`Correct Town: ${correctTown}`);
      console.log(`Updated Address: ${updatedAddress}`);

      // Update the record
      const { error: updateError } = await supabase
        .from('case_detail')
        .update({
          address: updatedAddress,
          town: correctTown
        })
        .eq('id', record.id);

      if (updateError) {
        console.error(`Error updating record ${record.id}:`, updateError);
      } else {
        console.log(`✓ Fixed record ${record.id}`);
      }

      console.log('---\n');
    }

    // Also check for records where town might be embedded in address
    console.log('\nChecking for other potential issues...\n');

    const recordsWithLongAddresses = cases.filter(record => {
      if (!record.address) return false;
      // Check if address contains town names
      return record.address.match(/,\s*(Andover|Bethel|[A-Z][a-z]+)/);
    });

    console.log(`Found ${recordsWithLongAddresses.length} records where town might be in address field\n`);

    for (const record of recordsWithLongAddresses) {
      // Parse address to extract town if it's there
      const addressParts = record.address.split(',').map(p => p.trim());

      if (addressParts.length > 1) {
        const possibleTown = addressParts[addressParts.length - 1];

        // Check if last part looks like a town name (starts with capital letter, no numbers)
        if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(possibleTown) && !record.town) {
          console.log(`ID: ${record.id}`);
          console.log(`Address: ${record.address}`);
          console.log(`Possible town in address: ${possibleTown}`);
          console.log(`Current town: ${record.town || 'null'}`);

          const cleanAddress = addressParts.slice(0, -1).join(', ');

          const { error: updateError } = await supabase
            .from('case_detail')
            .update({
              address: cleanAddress,
              town: possibleTown
            })
            .eq('id', record.id);

          if (updateError) {
            console.error(`Error updating record ${record.id}:`, updateError);
          } else {
            console.log(`✓ Fixed record ${record.id}`);
          }

          console.log('---\n');
        }
      }
    }

    console.log('Analysis and fixes complete!');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
analyzeAndFixTownData();