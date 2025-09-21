#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function renameTable() {
  try {
    console.log('Renaming defendants table to case_detail...');

    // Execute the rename using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE defendants RENAME TO case_detail;'
    });

    if (error) {
      console.error('Error renaming table:', error);
      console.log('\nNote: You may need to rename the table directly in Supabase dashboard:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to Table Editor');
      console.log('3. Find the "defendants" table');
      console.log('4. Click on the table settings and rename it to "case_detail"');
      return;
    }

    console.log('Table renamed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
    console.log('\nPlease rename the table manually in Supabase dashboard.');
  }
}

renameTable();