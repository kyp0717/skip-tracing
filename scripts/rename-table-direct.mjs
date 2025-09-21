#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function renameTable() {
  try {
    console.log('Renaming defendants table to case_detail...');

    // Check if defendants table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['defendants', 'case_detail']);

    if (tablesError) {
      console.error('Error checking tables:', tablesError);

      // Try raw SQL approach
      console.log('\nAttempting direct SQL rename...');
      const { data, error } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE defendants RENAME TO case_detail;'
      });

      if (error) {
        console.error('Direct SQL failed:', error);
        console.log('\n⚠️  The table rename failed. Please rename the table manually:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to Table Editor');
        console.log('3. Find the "defendants" table');
        console.log('4. Click the three dots menu → Edit Table');
        console.log('5. Change the name to "case_detail"');
        console.log('6. Save the changes');
        return;
      }
    }

    if (tables) {
      const tableNames = tables.map(t => t.table_name);

      if (tableNames.includes('case_detail')) {
        console.log('✅ Table "case_detail" already exists! Rename successful or already completed.');
        return;
      }

      if (!tableNames.includes('defendants')) {
        console.log('❌ Table "defendants" not found. It may have already been renamed.');
        return;
      }
    }

    console.log('\n📝 Manual rename required. Please follow these steps:');
    console.log('1. Go to https://supabase.com/dashboard/project/ebzadwellpowchycycbq/editor');
    console.log('2. Click on "SQL Editor" in the left sidebar');
    console.log('3. Paste and run this SQL command:');
    console.log('\n   ALTER TABLE defendants RENAME TO case_detail;\n');
    console.log('4. Click "Run" to execute the query');

  } catch (error) {
    console.error('Error:', error);
    console.log('\nPlease rename the table manually in the Supabase dashboard.');
  }
}

renameTable();