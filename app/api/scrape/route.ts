import { NextRequest, NextResponse } from 'next/server';
import { scrapeTown } from '@/app/lib/scraper';
import { sql } from '@/app/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { town } = body;

    if (!town) {
      return NextResponse.json({ error: 'Town is required' }, { status: 400 });
    }

    // Scrape the data
    const { cases, defendants } = await scrapeTown(town);

    // Store cases in database
    for (const caseData of cases) {
      await sql`
        INSERT INTO cases (case_name, docket_number, docket_url, town)
        VALUES (${caseData.case_name}, ${caseData.docket_number}, ${caseData.docket_url}, ${caseData.town})
        ON CONFLICT (docket_number)
        DO UPDATE SET
          case_name = EXCLUDED.case_name,
          docket_url = EXCLUDED.docket_url,
          town = EXCLUDED.town
      `;
    }

    // Store defendants in database
    for (const defendant of defendants) {
      await sql`
        INSERT INTO defendants (docket_number, name, address, town, state, zip)
        VALUES (${defendant.docket_number}, ${defendant.name}, ${defendant.address},
                ${defendant.town}, ${defendant.state}, ${defendant.zip})
        ON CONFLICT (docket_number, name)
        DO UPDATE SET
          address = EXCLUDED.address,
          town = EXCLUDED.town,
          state = EXCLUDED.state,
          zip = EXCLUDED.zip
      `;
    }

    return NextResponse.json({
      success: true,
      stats: {
        cases_scraped: cases.length,
        defendants_scraped: defendants.length
      }
    });
  } catch (error) {
    console.error('Error in scrape API:', error);
    return NextResponse.json({
      error: 'Failed to scrape data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}