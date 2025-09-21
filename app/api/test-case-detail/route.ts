import { NextRequest, NextResponse } from 'next/server';
import { CTJudiciaryScaper } from '@/app/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { docket_number } = body;

    if (!docket_number) {
      return NextResponse.json({ error: 'Docket number is required' }, { status: 400 });
    }

    // Construct the case detail URL
    const caseUrl = `https://civilinquiry.jud.ct.gov/CaseDetail/PublicCaseDetail.aspx?DocketNo=${encodeURIComponent(docket_number)}`;

    console.log(`Testing case detail scraping for docket: ${docket_number}`);
    console.log(`URL: ${caseUrl}`);

    // Initialize scraper and extract defendants
    const scraper = new CTJudiciaryScaper();

    try {
      await scraper.init();
      const defendants = await scraper.scrapeDefendantsFromCase(caseUrl);

      return NextResponse.json({
        success: true,
        docket_number,
        url: caseUrl,
        defendants_found: defendants.length,
        defendants
      });

    } finally {
      await scraper.close();
    }

  } catch (error) {
    console.error('Error in test case detail API:', error);
    return NextResponse.json({
      error: 'Failed to scrape case detail',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Case Detail API',
    usage: 'POST with { "docket_number": "FBT-CV24-6127296-S" }',
    example_dockets: [
      'FBT-CV24-6127296-S',
      'HHD-CV24-6191907-S',
      'FBT-CV24-6127450-S'
    ]
  });
}