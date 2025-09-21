import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { chromium } = await import('playwright');
    const searchParams = request.nextUrl.searchParams;
    const docketUrl = searchParams.get('url');

    if (!docketUrl) {
      // Get a sample case from Andover
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      const url = 'https://civilinquiry.jud.ct.gov/PropertyAddressSearch.aspx';
      await page.goto(url, { waitUntil: 'networkidle' });

      // Fill and submit form
      await page.fill('#ctl00_ContentPlaceHolder1_txtCityTown', 'Andover');
      await page.click('#ctl00_ContentPlaceHolder1_btnSubmit');
      await page.waitForLoadState('networkidle');

      // Get first case link
      const firstLink = await page.evaluate(() => {
        const link = document.querySelector('#ctl00_ContentPlaceHolder1_gvPropertyResults a');
        return link ? (link as HTMLAnchorElement).href : null;
      });

      await browser.close();

      if (!firstLink) {
        return NextResponse.json({ error: 'No cases found' }, { status: 404 });
      }

      // Redirect to this endpoint with the URL
      return NextResponse.redirect(new URL(`/api/scrape-test?url=${encodeURIComponent(firstLink)}`, request.url));
    }

    // Scrape the specific case page
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(docketUrl, { waitUntil: 'networkidle' });

    // Get page structure for debugging
    const pageInfo = await page.evaluate(() => {
      // Get all text content that might contain "Defendant"
      const allText = document.body.textContent || '';
      const hasDefendantText = allText.includes('Defendant');

      // Find all tables
      const tables = Array.from(document.querySelectorAll('table')).map((table, idx) => {
        const firstRows = Array.from(table.querySelectorAll('tr')).slice(0, 5);
        return {
          index: idx,
          id: table.id,
          className: table.className,
          rowCount: table.querySelectorAll('tr').length,
          firstRowsHtml: firstRows.map(row => row.innerHTML.substring(0, 500)),
          containsDefendant: (table.textContent || '').includes('Defendant')
        };
      });

      // Look specifically for party information
      const partyInfo: any[] = [];

      // Method 1: Look for rows with "Defendant" text
      const allRows = Array.from(document.querySelectorAll('tr'));
      allRows.forEach((row, idx) => {
        const rowText = row.textContent || '';
        if (rowText.includes('Defendant') && !rowText.includes('Attorney for')) {
          const cells = Array.from(row.querySelectorAll('td'));
          partyInfo.push({
            method: 'defendant-text-search',
            rowIndex: idx,
            cellCount: cells.length,
            cellTexts: cells.map(cell => cell.textContent?.trim()).filter(t => t),
            innerHTML: row.innerHTML.substring(0, 1000)
          });
        }
      });

      // Method 2: Look for specific party table patterns
      const partyTables = tables.filter(t =>
        t.containsDefendant ||
        (document.getElementById(t.id)?.textContent || '').includes('Party')
      );

      return {
        hasDefendantText,
        tableCount: tables.length,
        tables: tables.filter(t => t.containsDefendant || t.rowCount > 0),
        partyInfo,
        partyTableCount: partyTables.length,
        pageTitle: document.title,
        // Get a sample of the page HTML structure
        bodySample: document.body.innerHTML.substring(0, 3000)
      };
    });

    await browser.close();

    return NextResponse.json({
      docketUrl,
      pageInfo
    });

  } catch (error) {
    console.error('Scrape test error:', error);
    return NextResponse.json({
      error: 'Failed to scrape',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}