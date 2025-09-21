import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const docket_number = searchParams.get('docket_number');

    if (!docket_number) {
      return NextResponse.json(
        { error: 'docket_number is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('skiptrace')
      .delete()
      .eq('docket_number', docket_number)
      .select();

    if (error) {
      console.error('Error deleting skip trace records:', error);
      return NextResponse.json(
        { error: 'Failed to delete records', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: data?.length || 0,
      records: data
    });

  } catch (error) {
    console.error('Error in clear skip trace:', error);
    return NextResponse.json(
      { error: 'Failed to clear skip trace', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}