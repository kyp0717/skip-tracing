import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/lib/db';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const town = searchParams.get('town');
    const county = searchParams.get('county');

    // Use Supabase if available
    if (supabase) {
      let query = supabase.from('cases').select('*');

      if (town) {
        query = query.eq('town', town);
      } else if (county) {
        // First get towns in that county
        const { data: townsData } = await supabase
          .from('ct_towns')
          .select('town')
          .eq('county', county);

        const townNames = townsData?.map(t => t.town) || [];

        if (townNames.length > 0) {
          query = query.in('town', townNames);
        } else {
          return NextResponse.json({ cases: [] });
        }
      }

      query = query.order('created_at', { ascending: false }).limit(100);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching cases from Supabase:', error);
        return NextResponse.json({ cases: [] });
      }

      return NextResponse.json({ cases: data || [] });
    }

    // Fallback to Vercel Postgres if Supabase not configured
    let result;
    if (town) {
      result = await sql`
        SELECT * FROM cases
        WHERE LOWER(town) = LOWER(${town})
        ORDER BY created_at DESC
      `;
    } else if (county) {
      const townsInCounty = await sql`
        SELECT DISTINCT town FROM ct_towns
        WHERE LOWER(county) = LOWER(${county})
      `;

      const townNames = townsInCounty.rows.map(t => t.town);

      if (townNames.length > 0) {
        result = await sql`
          SELECT * FROM cases
          WHERE town = ANY(${townNames})
          ORDER BY created_at DESC
        `;
      } else {
        result = { rows: [] };
      }
    } else {
      result = await sql`
        SELECT * FROM cases
        ORDER BY created_at DESC
        LIMIT 100
      `;
    }

    return NextResponse.json({ cases: result.rows });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ cases: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { case_name, docket_number, docket_url, town } = body;

    const result = await sql`
      INSERT INTO cases (case_name, docket_number, docket_url, town)
      VALUES (${case_name}, ${docket_number}, ${docket_url}, ${town})
      ON CONFLICT (docket_number)
      DO UPDATE SET
        case_name = EXCLUDED.case_name,
        docket_url = EXCLUDED.docket_url,
        town = EXCLUDED.town
      RETURNING *
    `;

    return NextResponse.json({ case: result.rows[0] });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}