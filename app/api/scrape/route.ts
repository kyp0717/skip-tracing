import { NextRequest, NextResponse } from 'next/server';
import { scrapeTown } from '@/app/lib/scraper';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { town, county } = body;

    if (!town && !county) {
      return NextResponse.json({ error: 'Town or county is required' }, { status: 400 });
    }

    let townsToScrape = [];
    if (town) {
      townsToScrape = [town];
    } else if (county) {
      // Get all towns in the county
      if (supabase) {
        const { data: townData } = await supabase
          .from('ct_towns')
          .select('town')
          .eq('county', county);

        townsToScrape = townData?.map(t => t.town) || [];
      }

      if (townsToScrape.length === 0) {
        return NextResponse.json({
          error: `No towns found for county: ${county}`
        }, { status: 400 });
      }
    }

    let totalCases = 0;
    let totalDefendants = 0;

    for (const townName of townsToScrape) {
      console.log(`Scraping town: ${townName}`);

      // Scrape the data
      const { cases, defendants } = await scrapeTown(townName);

      // Store in Supabase if available
      if (supabase) {
        // Store cases
        for (const caseData of cases) {
          const { error: caseError } = await supabase
            .from('cases')
            .upsert({
              case_name: caseData.case_name,
              docket_number: caseData.docket_number,
              docket_url: caseData.docket_url,
              town: caseData.town
            }, {
              onConflict: 'docket_number'
            });

          if (caseError) {
            console.error('Error storing case:', caseError);
          }
        }

        // Store defendants
        for (const defendant of defendants) {
          const { error: defError } = await supabase
            .from('defendants')
            .upsert({
              docket_number: defendant.docket_number,
              name: defendant.name,
              address: defendant.address,
              town: defendant.town,
              state: defendant.state,
              zip: defendant.zip
            }, {
              onConflict: 'docket_number,name'
            });

          if (defError) {
            console.error('Error storing defendant:', defError);
          }
        }
      }

      totalCases += cases.length;
      totalDefendants += defendants.length;
    }

    return NextResponse.json({
      success: true,
      stats: {
        cases_scraped: totalCases,
        defendants_scraped: totalDefendants
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