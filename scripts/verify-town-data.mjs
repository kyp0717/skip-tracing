import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTownData() {
  console.log('Verifying town data in case_detail table...\n');

  try {
    // Get all case_detail records
    const { data: cases, error } = await supabase
      .from('case_detail')
      .select('id, docket_number, address, town, state, zip')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching case details:', error);
      return;
    }

    console.log(`Total records: ${cases.length}\n`);

    // Pattern to detect apartment/unit numbers
    const apartmentPattern = /^(APT|APARTMENT|UNIT|SUITE|STE|#)\s*[\w\d-]+$/i;

    // Check for any remaining issues
    const issuesFound = [];

    for (const record of cases) {
      const issues = [];

      // Check if town contains apartment/unit pattern
      if (record.town && apartmentPattern.test(record.town.trim())) {
        issues.push(`Town contains apartment/unit: "${record.town}"`);
      }

      // Check if town is missing or invalid
      if (!record.town || record.town.trim().length === 0) {
        issues.push('Town is missing');
      } else if (!/^[A-Za-z\s-]+$/.test(record.town)) {
        issues.push(`Town contains invalid characters: "${record.town}"`);
      }

      // Check if address is too short (might be missing parts)
      if (record.address && record.address.trim().length < 5) {
        issues.push(`Address seems too short: "${record.address}"`);
      }

      if (issues.length > 0) {
        issuesFound.push({
          id: record.id,
          docket_number: record.docket_number,
          address: record.address,
          town: record.town,
          issues
        });
      }
    }

    if (issuesFound.length === 0) {
      console.log('✅ All town data looks correct!');

      // Show summary of towns
      const townCounts = {};
      cases.forEach(c => {
        const town = c.town || 'Unknown';
        townCounts[town] = (townCounts[town] || 0) + 1;
      });

      console.log('\nTown distribution:');
      Object.entries(townCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([town, count]) => {
          console.log(`  ${town}: ${count} records`);
        });

    } else {
      console.log(`⚠️  Found ${issuesFound.length} records with potential issues:\n`);
      issuesFound.forEach(record => {
        console.log(`ID: ${record.id}`);
        console.log(`Docket: ${record.docket_number}`);
        console.log(`Address: ${record.address}`);
        console.log(`Town: ${record.town}`);
        console.log(`Issues: ${record.issues.join(', ')}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
verifyTownData();