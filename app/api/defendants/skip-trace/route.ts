import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { docket_number, limit = 10 } = body;

    if (!docket_number) {
      return NextResponse.json(
        { error: 'docket_number is required' },
        { status: 400 }
      );
    }

    // Get case details for the docket number
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const { data: defendantsData, error: defendantsError } = await supabase
      .from('case_detail')
      .select(`
        id,
        address,
        town,
        state,
        zip,
        docket_number,
        d_01,
        d_02,
        d_03,
        d_04,
        d_05
      `)
      .eq('docket_number', docket_number)
      .limit(limit);

    if (defendantsError) {
      console.error('Error fetching defendants:', defendantsError);
      return NextResponse.json(
        { error: 'Failed to fetch case details' },
        { status: 500 }
      );
    }

    // Get skip trace counts for this docket number
    let skipTraceCounts: Record<number, number> = {};

    const { data: skipTraceData, error: skipTraceError } = await supabase
      .from('skiptrace')
      .select('*')
      .eq('docket_number', docket_number);

    // Count skip traces by some identifier (since they're all for the same docket)
    const skipTraceCount = skipTraceData?.length || 0;

    const defendantsResult = {
      rows: defendantsData?.map(d => ({
        ...d,
        existing_skip_traces: skipTraceCount > 0 ? 1 : 0  // Mark if any skip traces exist for this docket
      })) || []
    };

    if (defendantsResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No case details found for this docket number' },
        { status: 404 }
      );
    }

    const results = [];
    const errors = [];

    // Process each defendant
    for (const defendant of defendantsResult.rows) {
      // Get the first available defendant name
      const defendantName = defendant.d_01 || defendant.d_02 || defendant.d_03 ||
                           defendant.d_04 || defendant.d_05 || 'Unknown';

      // Skip if already has skip trace results
      if (defendant.existing_skip_traces > 0) {
        results.push({
          docket_number: defendant.docket_number,
          name: defendantName,
          status: 'skipped',
          reason: 'Already has skip trace results'
        });
        continue;
      }

      // Skip if no address
      if (!defendant.address) {
        results.push({
          docket_number: defendant.docket_number,
          name: defendantName,
          status: 'skipped',
          reason: 'No address available'
        });
        continue;
      }

      try {
        // Call BatchData API
        const skipTraceResponse = await fetch(
          `${request.nextUrl.origin}/api/batchdata`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              docket_number: defendant.docket_number,
              address: formatDefendantAddress(defendant)
            })
          }
        );

        if (skipTraceResponse.ok) {
          const skipTraceData = await skipTraceResponse.json();
          results.push({
            docket_number: defendant.docket_number,
            name: defendantName,
            status: 'success',
            data: skipTraceData
          });
        } else {
          const errorData = await skipTraceResponse.json();
          errors.push({
            docket_number: defendant.docket_number,
            name: defendantName,
            status: 'failed',
            error: errorData.error || 'Skip trace failed'
          });
        }
      } catch (error) {
        errors.push({
          docket_number: defendant.docket_number,
          name: defendantName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      docket_number,
      processed: results.length + errors.length,
      successful: results.filter(r => r.status === 'success').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Error performing batch skip trace:', error);
    return NextResponse.json(
      { error: 'Failed to perform skip trace', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check skip trace status for a docket
export async function GET(request: NextRequest) {
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

    const { data: resultData, error: resultError } = await supabase
      .from('case_detail')
      .select(`
        id,
        address,
        town,
        state,
        zip,
        d_01,
        d_02,
        d_03,
        d_04,
        d_05
      `)
      .eq('docket_number', docket_number);

    if (resultError) {
      console.error('Error fetching skip trace status:', resultError);
      return NextResponse.json(
        { error: 'Failed to fetch skip trace status' },
        { status: 500 }
      );
    }

    // Get skip trace data for this docket
    const { data: skipTraceData, error: skipTraceError } = await supabase
      .from('skiptrace')
      .select('created_at')
      .eq('docket_number', docket_number)
      .order('created_at', { ascending: false });

    const skipTraceCount = skipTraceData?.length || 0;
    const lastSkipTrace = skipTraceData?.[0]?.created_at || null;

    const result = {
      rows: resultData?.map(d => ({
        ...d,
        skip_trace_count: skipTraceCount,
        last_skip_trace: lastSkipTrace
      })) || []
    };

    const totalDefendants = result.rows.length;
    const defendantsWithSkipTrace = result.rows.filter(r => r.skip_trace_count > 0).length;

    return NextResponse.json({
      docket_number,
      total_defendants: totalDefendants,
      defendants_with_skip_trace: defendantsWithSkipTrace,
      coverage_percentage: totalDefendants > 0 ? Math.round((defendantsWithSkipTrace / totalDefendants) * 100) : 0,
      defendants: result.rows
    });

  } catch (error) {
    console.error('Error fetching skip trace status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skip trace status' },
      { status: 500 }
    );
  }
}

function formatDefendantAddress(defendant: any): string {
  const parts = [];

  if (defendant.address) {
    parts.push(defendant.address);
  }

  if (defendant.town) {
    parts.push(defendant.town);
  }

  const stateZip = [];
  if (defendant.state) {
    stateZip.push(defendant.state);
  }
  if (defendant.zip) {
    stateZip.push(defendant.zip);
  }

  if (stateZip.length > 0) {
    parts.push(stateZip.join(' '));
  }

  return parts.join(', ');
}