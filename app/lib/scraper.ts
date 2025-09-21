interface ScrapedCase {
  case_name: string;
  docket_number: string;
  docket_url: string;
  town: string;
}

interface Defendant {
  docket_number: string;
  address: string;
  town: string;
  state: string;
  zip: string;
  d_01?: string;
  d_02?: string;
  d_03?: string;
  d_04?: string;
  d_05?: string;
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

    // Wait for party information to load
    await this.page.waitForSelector('body', { timeout: 5000 });

    // Extract defendant information, property address and case details
    const pageData = await this.page.evaluate(() => {
      const result: any = {
        propertyAddress: '',
        propertyTown: '',
        propertyState: '',
        propertyZip: '',
        defendants: {}
      };

      // Get page text once at the beginning
      const pageText = document.body.textContent || '';

      // Extract property address using the specific HTML ID
      let propertyFullAddress = '';

      // First try to get address from the specific element
      const propAddressElement = document.getElementById('ctl00_ContentPlaceHolder1_CaseDetailBasicInfo1_PropAddressRow');
      if (propAddressElement) {
        // Get all TD elements in the row
        const tdElements = propAddressElement.querySelectorAll('td');

        // Usually the address is in the second TD (first is label, second is value)
        if (tdElements.length >= 2) {
          propertyFullAddress = tdElements[1].textContent?.trim() || '';
        } else if (tdElements.length === 1) {
          // Sometimes it might be just one TD with all content
          propertyFullAddress = tdElements[0].textContent?.replace(/Property Address[:\s]*/i, '').trim() || '';
        } else {
          // Fallback to getting all text from the row
          propertyFullAddress = propAddressElement.textContent?.replace(/Property Address[:\s]*/i, '').trim() || '';
        }

        // Clean up the address - remove extra whitespace and handle special cases
        propertyFullAddress = propertyFullAddress.replace(/\s+/g, ' ').trim();

        // If the address is just a dash or empty, treat it as no address
        if (propertyFullAddress === '-' || propertyFullAddress === '--' || propertyFullAddress === 'N/A') {
          propertyFullAddress = '';
        }
      }

      // If not found, try other patterns as fallback
      if (!propertyFullAddress) {
        const addressPatterns = [
          /Property\s+Address[:\s]+([^\n]+?)(?:\s{2,}|\n|$)/i,
          /Subject\s+Property[:\s]+([^\n]+?)(?:\s{2,}|\n|$)/i,
          /Premises[:\s]+([^\n]+?)(?:\s{2,}|\n|$)/i,
          /Located\s+at[:\s]+([^\n]+?)(?:\s{2,}|\n|$)/i
        ];

        for (const pattern of addressPatterns) {
          const match = pageText.match(pattern);
          if (match && match[1]) {
            propertyFullAddress = match[1].trim();
            // Clean up any remaining tabs or excessive spaces
            propertyFullAddress = propertyFullAddress.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
            break;
          }
        }
      }

      // If we found a property address, parse it
      if (propertyFullAddress) {
        // First, clean any aka/a.k.a from the address
        const akaPattern = /\s*(aka|a\/k\/a|a\.k\.a)\s+(.+)/i;
        const akaMatch = propertyFullAddress.match(akaPattern);
        let akaAddressPart = '';

        if (akaMatch) {
          akaAddressPart = akaMatch[2].trim();
          propertyFullAddress = propertyFullAddress.substring(0, akaMatch.index).trim();
        }

        // Parse address components
        // Common format: "123 Main St, Hartford, CT 06101" or with apartment/unit
        const addressParts = propertyFullAddress.split(',').map(part => part.trim());

        // Pattern to detect apartment/unit numbers
        const apartmentPattern = /^(APT|APARTMENT|UNIT|SUITE|STE|#)\s*[\w\d-]+$/i;

        if (addressParts.length >= 1) {
          result.propertyAddress = addressParts[0]; // Street address
          if (akaAddressPart) {
            result.propertyAddress += ` (aka ${akaAddressPart})`;
          }
        }

        // Check if the second part is an apartment/unit number
        if (addressParts.length >= 2) {
          const secondPart = addressParts[1];

          if (apartmentPattern.test(secondPart)) {
            // This is an apartment/unit number, append to address
            result.propertyAddress = `${result.propertyAddress} ${secondPart}`;

            // Town should be in the next part
            if (addressParts.length >= 3) {
              result.propertyTown = addressParts[2];
            }

            // State and ZIP in the part after that
            if (addressParts.length >= 4) {
              const stateZip = addressParts[3].trim();
              const stateZipMatch = stateZip.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);

              if (stateZipMatch) {
                result.propertyState = stateZipMatch[1];
                result.propertyZip = stateZipMatch[2];
              }
            }
          } else {
            // Normal case - second part is the town
            // Check if it contains aka/a.k.a pattern
            if (secondPart && (secondPart.toLowerCase().includes('aka') ||
                              secondPart.toLowerCase().includes('a/k/a') ||
                              secondPart.toLowerCase().includes('a.k.a'))) {
              // Skip this as town, it's likely misplaced aka data
              result.propertyTown = ''; // Will be validated later
            } else {
              result.propertyTown = secondPart;
            }

            if (addressParts.length >= 3) {
              // State and ZIP usually together like "CT 06101"
              const stateZip = addressParts[2].trim();
              const stateZipMatch = stateZip.match(/([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);

              if (stateZipMatch) {
                result.propertyState = stateZipMatch[1];
                result.propertyZip = stateZipMatch[2];
              } else {
                // Try to extract state (2 uppercase letters)
                const stateMatch = stateZip.match(/([A-Z]{2})/);
                if (stateMatch) {
                  result.propertyState = stateMatch[1];
                }

                // Try to extract ZIP (5 digits with optional -4 digits)
                const zipMatch = stateZip.match(/(\d{5}(?:-\d{4})?)/);
                if (zipMatch) {
                  result.propertyZip = zipMatch[1];
                }
              }
            }
          }
        }
      }

      // Extract defendants D-01 through D-05
      const defendantInfo: any[] = [];

      // Look for party information table or text patterns
      for (let i = 1; i <= 5; i++) {
        const defendantCode = `D-${String(i).padStart(2, '0')}`;

        // Pattern to match defendant entries
        const patterns = [
          new RegExp(`${defendantCode}\\s+([^\\n]+?)(?:\\s+Non-Appearing|\\s+Defendant|\\s+Self-Represented|$)`, 'i'),
          new RegExp(`${defendantCode}[:\\s]+([^\\n]+?)(?:\\s+Non-Appearing|\\s+Defendant|\\s+Self-Represented|$)`, 'i')
        ];

        for (const pattern of patterns) {
          const match = pageText.match(pattern);
          if (match && match[1]) {
            let name = match[1].trim();

            // Clean up the name
            name = name.replace(/\s+/g, ' ').trim();

            // Remove any trailing legal terms
            name = name.replace(/\s+(Non-Appearing|Defendant|Self-Represented)$/i, '').trim();

            // Skip if this looks like instructions or not a real name
            if (name.length > 2 && name.length < 100 &&
                !name.includes('Viewing Documents') &&
                !name.includes('If there is') &&
                !name.includes('Click here')) {

              result.defendants[`d_${String(i).padStart(2, '0')}`] = name;

              // Also add to defendantInfo array for backward compatibility
              defendantInfo.push({
                address: result.propertyAddress,
                town: result.propertyTown,
                state: result.propertyState || 'CT',
                zip: result.propertyZip,
                [`d_${String(i).padStart(2, '0')}`]: name
              });

              break; // Found this defendant, move to next
            }
          }
        }
      }

      // If we found at least one defendant with the new method, use that
      if (defendantInfo.length > 0) {
        return defendantInfo;
      }

      // Otherwise, create a single record with all the extracted data
      if (Object.keys(result.defendants).length > 0 || propertyFullAddress) {
        return [{
          address: result.propertyAddress,
          town: result.propertyTown,
          state: result.propertyState || 'CT',
          zip: result.propertyZip,
          d_01: result.defendants.d_01 || null,
          d_02: result.defendants.d_02 || null,
          d_03: result.defendants.d_03 || null,
          d_04: result.defendants.d_04 || null,
          d_05: result.defendants.d_05 || null
        }];
      }

      return [];
    });

    // Extract docket number from URL
    const docketMatch = docketUrl.match(/DocketNo=([^&]+)/);
    const docketNumber = docketMatch ? decodeURIComponent(docketMatch[1]) : '';

    console.log(`Found ${pageData.length} defendant records for docket ${docketNumber}`);
    if (pageData.length > 0) {
      console.log('Sample extracted data:', pageData[0]);
    }

    return pageData.map((d: Omit<Defendant, 'docket_number'>) => ({ ...d, docket_number: docketNumber }));
  }
}

// Helper function to validate town against ct_towns table
export async function isValidCTTown(town: string): Promise<boolean> {
  if (!town) return false;

  // Import Supabase client
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('ct_towns')
    .select('town')
    .ilike('town', town)
    .single();

  return !error && !!data;
}

// Helper function to clean address from aka/a.k.a
export function cleanAddressFromAka(address: string): { cleanAddress: string; akaAddress: string | null } {
  if (!address) return { cleanAddress: address, akaAddress: null };

  const akaPattern = /\s*(aka|a\/k\/a|a\.k\.a)\s+(.+)/i;
  const match = address.match(akaPattern);

  if (match) {
    const cleanAddress = address.substring(0, match.index).trim();
    const akaAddress = match[2].trim();
    return { cleanAddress, akaAddress };
  }

  return { cleanAddress: address, akaAddress: null };
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

          // Validate and clean defendant data
          for (const defendant of defendants) {
            // Clean address from aka
            const { cleanAddress, akaAddress } = cleanAddressFromAka(defendant.address);
            defendant.address = akaAddress ? `${cleanAddress} (aka ${akaAddress})` : cleanAddress;

            // Validate town
            if (defendant.town) {
              const isValid = await isValidCTTown(defendant.town);
              if (!isValid) {
                console.log(`Invalid town '${defendant.town}' for docket ${defendant.docket_number}, skipping town field`);
                defendant.town = '';
              }
            }
          }

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