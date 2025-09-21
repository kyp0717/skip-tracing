import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { town } = body;

    if (!town) {
      return NextResponse.json({ error: 'Town is required' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get cases for the town
    const { data: cases } = await supabase
      .from('cases')
      .select('docket_number')
      .eq('town', town);

    const docketNumbers = cases?.map(c => c.docket_number) || [];

    // Delete case details for those cases
    const { error: defError } = await supabase
      .from('case_detail')
      .delete()
      .in('docket_number', docketNumbers);

    if (defError) {
      console.error('Error deleting case details:', defError);
    }

    // Delete cases
    const { error: caseError } = await supabase
      .from('cases')
      .delete()
      .eq('town', town);

    if (caseError) {
      console.error('Error deleting cases:', caseError);
    }

    return NextResponse.json({
      success: true,
      message: `Cleared data for ${town}`,
      casesDeleted: docketNumbers.length
    });

  } catch (error) {
    console.error('Clear town error:', error);
    return NextResponse.json({
      error: 'Failed to clear town data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}