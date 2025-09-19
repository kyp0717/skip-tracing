import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dynamic import to avoid webpack issues
    const { chromium } = await import('playwright');

    // Test basic browser launch
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Try to navigate to the CT Judiciary site
    await page.goto('https://civilinquiry.jud.ct.gov/PropertyAddressSearch.aspx', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Get page title to confirm we reached the site
    const title = await page.title();

    // Try to find the town input field
    const selectors = [
      'input[id*="txtTown"]',
      'input[name*="txtTown"]',
      '#ctl00_ContentPlaceHolder1_txtTown',
      'input[type="text"][id*="Town"]'
    ];

    let foundSelector = null;
    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        foundSelector = selector;
        break;
      }
    }

    // Get all input fields on the page for debugging
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map(input => ({
        id: input.id,
        name: input.name,
        type: input.type,
        placeholder: input.placeholder
      }));
    });

    await browser.close();

    return NextResponse.json({
      success: true,
      pageTitle: title,
      foundTownInput: foundSelector,
      allInputs: inputs
    });
  } catch (error) {
    console.error('Scraper test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}