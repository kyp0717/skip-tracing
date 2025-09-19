interface ScrapedCase {
  case_name: string;
  docket_number: string;
  docket_url: string;
  town: string;
}

interface Defendant {
  docket_number: string;
  name: string;
  address: string;
  town: string;
  state: string;
  zip: string;
}

export class CTJudiciaryScaper {
  private browser: any = null;
  private page: any = null;

  async init() {
    const { chromium } = await import('playwright');
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeCasesByTown(town: string): Promise<ScrapedCase[]> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call init() first.');
    }

    const url = 'https://civilinquiry.jud.ct.gov/PropertyAddressSearch.aspx';
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle' });

    // Use exact selectors from CLAUDE.md
    try {
      // Fill the town input field using the exact ID from CLAUDE.md
      const townSelector = '#ctl00_ContentPlaceHolder1_txtCityTown';
      await this.page.waitForSelector(townSelector, { timeout: 10000 });
      await this.page.fill(townSelector, town);
      console.log(`Filled town field with: ${town}`);

      // Click the submit button using the exact ID from CLAUDE.md
      const submitSelector = '#ctl00_ContentPlaceHolder1_btnSubmit';
      await this.page.waitForSelector(submitSelector, { timeout: 10000 });
      await this.page.click(submitSelector);
      console.log('Clicked submit button, waiting for results...');

      // Wait for navigation or results to load
      await this.page.waitForLoadState('networkidle');

    } catch (error) {
      console.error('Error during form interaction:', error);
      throw error;
    }

    // Check if we have results
    try {
      // Wait for the results table - using the correct selector
      const resultSelector = '#ctl00_ContentPlaceHolder1_gvPropertyResults';
      await this.page.waitForSelector(resultSelector, { timeout: 10000 });
      console.log('Results table found, extracting data...');

      // Extract case data from the results table
      const cases = await this.page.evaluate(() => {
        const table = document.querySelector('#ctl00_ContentPlaceHolder1_gvPropertyResults');
        if (!table) return [];

        const rows = Array.from(table.querySelectorAll('tr')).slice(1); // Skip header row
        return rows.map(row => {
          const cells = row.querySelectorAll('td');
          const linkElement = row.querySelector('a');

          // The table structure from debug shows:
          // Column 0: City/Town
          // Column 1: Street Address
          // Column 2: Zip Code
          // Column 3: Case Name
          // Column 4: Docket No. (with link)
          // Column 5: Property Type
          // Column 6: Disposition

          return {
            docket_number: cells[4]?.textContent?.trim() || '',
            case_name: cells[3]?.textContent?.trim() || '',
            docket_url: linkElement ? (linkElement as HTMLAnchorElement).href : '',
            town: cells[0]?.textContent?.trim() || ''
          };
        }).filter(c => c.docket_number); // Only include rows with docket numbers
      });

      console.log(`Found ${cases.length} cases`);

      // Add town to each case
      return cases.map((c: Omit<ScrapedCase, 'town'>) => ({ ...c, town }));

    } catch (error) {
      console.log('No results found or error extracting data:', error);

      // Check if there's a "no results" message on the page
      const pageContent = await this.page.textContent('body');
      if (pageContent?.includes('No results found') || pageContent?.includes('No records')) {
        console.log('No foreclosure cases found for this town');
        return [];
      }

      // Log the page content for debugging
      console.log('Page title:', await this.page.title());

      return [];
    }
  }

  async scrapeDefendantsFromCase(docketUrl: string): Promise<Defendant[]> {
    if (!this.page) {
      throw new Error('Scraper not initialized. Call init() first.');
    }

    console.log(`Navigating to case: ${docketUrl}`);
    await this.page.goto(docketUrl, { waitUntil: 'networkidle' });

    // Extract defendant information
    const defendants = await this.page.evaluate(() => {
      // Look for party information tables
      const tables = Array.from(document.querySelectorAll('table'));
      const defendantTable = tables.find(table => {
        const text = table.textContent || '';
        return text.includes('Defendant') || text.includes('Party Information');
      });

      if (!defendantTable) {
        console.log('No defendant table found');
        return [];
      }

      const rows = Array.from(defendantTable.querySelectorAll('tr'));
      const defendantRows = rows.filter(row => {
        const text = row.textContent || '';
        return text.includes('Defendant') || row.querySelector('td')?.textContent?.includes('DEF');
      });

      return defendantRows.map(row => {
        const cells = row.querySelectorAll('td');
        let name = '';
        let address = '';

        // Extract name and address from cells
        if (cells.length >= 2) {
          name = cells[0]?.textContent?.trim() || '';
          address = cells[1]?.textContent?.trim() || '';
        } else if (cells.length === 1) {
          // Sometimes name and address are in the same cell
          const text = cells[0]?.textContent?.trim() || '';
          const lines = text.split('\n').map(l => l.trim()).filter(l => l);
          if (lines.length > 0) {
            name = lines[0];
            address = lines.slice(1).join(', ');
          }
        }

        // Parse address
        const addressParts = address.split(',').map(p => p.trim());
        const lastPart = addressParts[addressParts.length - 1] || '';
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);

        return {
          docket_number: '', // Will be filled from URL
          name: name.replace(/^(Defendant|DEF)\s*:?\s*/i, '').trim(),
          address: addressParts.slice(0, -1).join(', '),
          town: addressParts.length > 2 ? addressParts[addressParts.length - 2] : '',
          state: stateZipMatch ? stateZipMatch[1] : '',
          zip: stateZipMatch ? stateZipMatch[2] : ''
        };
      }).filter(d => d.name && !d.name.includes('Party Type'));
    });

    // Extract docket number from URL
    const docketMatch = docketUrl.match(/DocketNo=([^&]+)/);
    const docketNumber = docketMatch ? decodeURIComponent(docketMatch[1]) : '';

    console.log(`Found ${defendants.length} defendants for docket ${docketNumber}`);

    return defendants.map((d: Omit<Defendant, 'docket_number'>) => ({ ...d, docket_number: docketNumber }));
  }
}

export async function scrapeTown(town: string) {
  const scraper = new CTJudiciaryScaper();

  try {
    await scraper.init();
    console.log(`Starting scrape for town: ${town}`);

    const cases = await scraper.scrapeCasesByTown(town);
    console.log(`Found ${cases.length} foreclosure cases`);

    const allDefendants: Defendant[] = [];

    // Scrape defendant information for each case
    for (const scrapedCase of cases) {
      if (scrapedCase.docket_url) {
        try {
          const defendants = await scraper.scrapeDefendantsFromCase(scrapedCase.docket_url);
          allDefendants.push(...defendants);

          // Add a small delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to scrape defendants for ${scrapedCase.docket_number}:`, error);
        }
      }
    }

    console.log(`Total defendants found: ${allDefendants.length}`);
    return { cases, defendants: allDefendants };

  } finally {
    await scraper.close();
  }
}