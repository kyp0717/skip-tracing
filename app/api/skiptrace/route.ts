import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const defendant_id = searchParams.get('defendant_id');

    let result;
    if (defendant_id) {
      result = await sql`
        SELECT s.*, d.name as defendant_name
        FROM skiptrace s
        JOIN defendants d ON s.defendant_id = d.id
        WHERE s.defendant_id = ${defendant_id}
        ORDER BY s.created_at DESC
      `;
    } else {
      result = await sql`
        SELECT s.*, d.name as defendant_name
        FROM skiptrace s
        JOIN defendants d ON s.defendant_id = d.id
        ORDER BY s.created_at DESC
        LIMIT 100
      `;
    }

    return NextResponse.json({ skiptraces: result.rows });
  } catch (error) {
    console.error('Error fetching skiptraces:', error);
    return NextResponse.json({ error: 'Failed to fetch skiptraces' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { defendant_id, phone_number, phone_type, source, api_response } = body;

    const result = await sql`
      INSERT INTO skiptrace (defendant_id, phone_number, phone_type, source, api_response)
      VALUES (${defendant_id}, ${phone_number}, ${phone_type}, ${source}, ${JSON.stringify(api_response)})
      RETURNING *
    `;

    return NextResponse.json({ skiptrace: result.rows[0] });
  } catch (error) {
    console.error('Error creating skiptrace:', error);
    return NextResponse.json({ error: 'Failed to create skiptrace' }, { status: 500 });
  }
}