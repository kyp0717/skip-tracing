import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const docket_number = searchParams.get('docket_number');

    let result;
    if (docket_number) {
      result = await sql`
        SELECT d.*, c.case_name, c.town as case_town
        FROM case_detail d
        JOIN cases c ON d.docket_number = c.docket_number
        WHERE d.docket_number = ${docket_number}
        ORDER BY d.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT d.*, c.case_name, c.town as case_town
        FROM case_detail d
        JOIN cases c ON d.docket_number = c.docket_number
        ORDER BY d.created_at DESC
        LIMIT 100
      `;
    }

    return NextResponse.json({ defendants: result.rows });
  } catch (error) {
    console.error('Error fetching defendants:', error);
    return NextResponse.json({ error: 'Failed to fetch case details' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { docket_number, name, address, town, state, zip } = body;

    const result = await sql`
      INSERT INTO case_detail (docket_number, name, address, town, state, zip)
      VALUES (${docket_number}, ${name}, ${address}, ${town}, ${state}, ${zip})
      ON CONFLICT (docket_number, name)
      DO UPDATE SET
        address = EXCLUDED.address,
        town = EXCLUDED.town,
        state = EXCLUDED.state,
        zip = EXCLUDED.zip
      RETURNING *
    `;

    return NextResponse.json({ defendant: result.rows[0] });
  } catch (error) {
    console.error('Error creating defendant:', error);
    return NextResponse.json({ error: 'Failed to create case detail' }, { status: 500 });
  }
}