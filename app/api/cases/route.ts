import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const town = searchParams.get('town');

    let result;
    if (town) {
      result = await sql`
        SELECT * FROM cases
        WHERE LOWER(town) = LOWER(${town})
        ORDER BY created_at DESC
      `;
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
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
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