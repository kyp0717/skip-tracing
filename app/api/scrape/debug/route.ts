import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { chromium } = await import('playwright');
    const body = await request.json();
    const { town } = body;

    if (!town) {
      return NextResponse.json({ error: 'Town is required' }, { status: 400 });
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const url = 'https://civilinquiry.jud.ct.gov/PropertyAddressSearch.aspx';
    await page.goto(url, { waitUntil: 'networkidle' });

    // Fill and submit form
    const townSelector = '#ctl00_ContentPlaceHolder1_txtCityTown';
    await page.fill(townSelector, town);

    const submitSelector = '#ctl00_ContentPlaceHolder1_btnSubmit';
    await page.click(submitSelector);

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    // Capture page info after submission
    const title = await page.title();
    const currentUrl = page.url();

    // Try to find any tables on the page
    const tables = await page.evaluate(() => {
      const allTables = Array.from(document.querySelectorAll('table'));
      return allTables.map(table => ({
        id: table.id,
        className: table.className,
        rowCount: table.querySelectorAll('tr').length,
        firstRowText: table.querySelector('tr')?.textContent?.trim().substring(0, 100)
      }));
    });

    // Check for specific result elements
    const resultElements = await page.evaluate(() => {
      const results: any = {};

      // Check for the specific results table
      const grdResults = document.querySelector('#ctl00_ContentPlaceHolder1_grdResults');
      results.hasGrdResults = !!grdResults;

      // Check for any element with "grdResults" in the ID
      const anyGrdResults = document.querySelector('[id*="grdResults"]');
      results.hasAnyGrdResults = !!anyGrdResults;
      if (anyGrdResults) {
        results.grdResultsId = anyGrdResults.id;
      }

      // Check for error or no results messages
      const bodyText = document.body.textContent || '';
      results.hasNoResultsMessage = bodyText.includes('No results') || bodyText.includes('No records');

      // Get all form inputs to see if we're still on the search page
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="submit"]'));
      results.formInputs = inputs.map(input => ({
        id: (input as HTMLInputElement).id,
        type: (input as HTMLInputElement).type,
        value: (input as HTMLInputElement).value
      }));

      return results;
    });

    // Get a snippet of the page HTML for debugging
    const pageHtml = await page.content();
    const htmlSnippet = pageHtml.substring(0, 2000);

    await browser.close();

    return NextResponse.json({
      success: true,
      town,
      pageInfo: {
        title,
        currentUrl,
        tables,
        resultElements,
        htmlSnippet: htmlSnippet.includes('grdResults') ? 'Contains grdResults' : 'No grdResults found',
        fullHtmlLength: pageHtml.length
      }
    });

  } catch (error) {
    console.error('Debug scrape error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}