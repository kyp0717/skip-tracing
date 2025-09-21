import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const town = searchParams.get('town') || 'Andover';

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get cases for the town
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('*')
      .eq('town', town)
      .order('docket_number');

    if (casesError) {
      console.error('Error fetching cases:', casesError);
      return NextResponse.json({ error: 'Failed to fetch cases', details: casesError }, { status: 500 });
    }

    // Get case details for those cases
    const docketNumbers = cases?.map(c => c.docket_number) || [];

    const { data: caseDetails, error: caseDetailsError } = await supabase
      .from('case_detail')
      .select('*')
      .in('docket_number', docketNumbers)
      .order('docket_number, name');

    if (caseDetailsError) {
      console.error('Error fetching case details:', caseDetailsError);
      return NextResponse.json({ error: 'Failed to fetch case details', details: caseDetailsError }, { status: 500 });
    }

    // Combine data
    const result = cases?.map(c => ({
      case: {
        docket_number: c.docket_number,
        case_name: c.case_name,
        town: c.town,
        docket_url: c.docket_url
      },
      defendants: caseDetails?.filter(d => d.docket_number === c.docket_number) || []
    }));

    return NextResponse.json({
      town,
      total_cases: cases?.length || 0,
      total_defendants: caseDetails?.length || 0,
      data: result,
      sample_defendant: caseDetails?.[0] || null
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}