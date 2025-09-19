import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET() {
  try {
    if (!supabase) {
      console.warn('Supabase not configured - returning sample CT towns');
      // Return sample CT towns for development/testing when Supabase is not configured
      return NextResponse.json({
        towns: [
          { id: 1, name: 'Bridgeport' },
          { id: 2, name: 'Hartford' },
          { id: 3, name: 'New Haven' },
          { id: 4, name: 'Stamford' },
          { id: 5, name: 'Waterbury' },
          { id: 6, name: 'Norwalk' },
          { id: 7, name: 'Danbury' },
          { id: 8, name: 'New Britain' },
          { id: 9, name: 'Bristol' },
          { id: 10, name: 'Meriden' }
        ]
      });
    }

    const { data: towns, error } = await supabase
      .from('ct_towns')
      .select('*')
      .order('town', { ascending: true });

    if (error) {
      console.error('Error fetching towns:', error);
      return NextResponse.json(
        { error: 'Failed to fetch towns' },
        { status: 500 }
      );
    }

    return NextResponse.json({ towns });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}