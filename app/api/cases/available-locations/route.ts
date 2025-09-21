import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      // For development without database, return sample data
      console.warn('Supabase not configured - returning sample towns with cases');
      return NextResponse.json({
        towns: ['Hartford', 'New Haven', 'Bridgeport', 'Stamford'],
        counties: ['Hartford', 'New Haven', 'Fairfield']
      });
    }

    // Get distinct towns that have cases
    const { data: townsData, error: townsError } = await supabase
      .from('cases')
      .select('town')
      .not('town', 'is', null)
      .order('town');

    if (townsError) {
      console.error('Error fetching towns:', townsError);
      // Return empty arrays instead of error
      return NextResponse.json({
        towns: [],
        counties: []
      });
    }

    // Get unique towns
    const uniqueTowns = Array.from(new Set(townsData?.map(r => r.town) || []));

    // Get counties for those towns
    const { data: countiesData, error: countiesError } = await supabase
      .from('ct_towns')
      .select('county')
      .in('town', uniqueTowns)
      .not('county', 'is', null);

    if (countiesError) {
      console.error('Error fetching counties:', countiesError);
    }

    // Get unique counties
    const uniqueCounties = Array.from(new Set(countiesData?.map(r => r.county) || [])).sort();

    return NextResponse.json({
      towns: uniqueTowns,
      counties: uniqueCounties
    });
  } catch (error) {
    console.error('Error fetching available locations:', error);
    // Return empty arrays instead of error for better UX
    return NextResponse.json({
      towns: [],
      counties: []
    });
  }
}