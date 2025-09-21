import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

const BATCHDATA_API_URL = 'https://api.batchdata.com/api/v1/property/skip-trace';
const USE_SANDBOX = process.env.USE_SANDBOX === 'true';
const BATCHDATA_API_KEY = process.env.BATCHDATA_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { docket_number, address, name } = body;

    // Validate required fields
    if (!docket_number || !address) {
      return NextResponse.json(
        { error: 'docket_number and address are required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!BATCHDATA_API_KEY) {
      return NextResponse.json(
        { error: 'BatchData API key not configured' },
        { status: 500 }
      );
    }

    // Parse address for BatchData format
    const propertyAddress = parseAddressToPropertyFormat(address);

    let skipTraceData;

    if (USE_SANDBOX) {
      // Use sandbox data for testing
      skipTraceData = generateSandboxData();
    } else {
      // Make BatchData API request
      const requestBody = {
        requests: [{
          propertyAddress
        }]
      };

      console.log('BatchData API Request:', JSON.stringify(requestBody, null, 2));

      const batchDataResponse = await fetch(BATCHDATA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BATCHDATA_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!batchDataResponse.ok) {
        const errorText = await batchDataResponse.text();
        console.error('BatchData API error:', errorText);
        return NextResponse.json(
          { error: 'BatchData API request failed', details: errorText },
          { status: batchDataResponse.status }
        );
      }

      skipTraceData = await batchDataResponse.json();
      console.log('BatchData API Response:', JSON.stringify(skipTraceData, null, 2));
    }

    // Process and store the results
    const results = await processSkipTraceResults(docket_number, skipTraceData, USE_SANDBOX ? 'sandbox' : 'production');

    return NextResponse.json({
      success: true,
      source: USE_SANDBOX ? 'sandbox' : 'production',
      results
    });

  } catch (error) {
    console.error('Error in BatchData skip trace:', error);
    return NextResponse.json(
      { error: 'Failed to perform skip trace', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve skip trace results for a defendant
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const docket_number = searchParams.get('docket_number');

    if (!docket_number) {
      return NextResponse.json(
        { error: 'docket_number is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const { data: skiptraceData, error: skiptraceError } = await supabase
      .from('skiptrace')
      .select('*')
      .eq('docket_number', docket_number)
      .order('created_at', { ascending: false });

    if (skiptraceError) {
      console.error('Error fetching skip trace data:', skiptraceError);
      return NextResponse.json(
        { error: 'Failed to fetch skip trace data' },
        { status: 500 }
      );
    }

    const { data: defendantData, error: defendantError } = await supabase
      .from('case_detail')
      .select('address, town, state, zip, d_01, d_02, d_03, d_04, d_05')
      .eq('docket_number', docket_number);

    if (defendantError) {
      console.error('Error fetching defendant data:', defendantError);
    }

    const defendants = defendantData || [];
    const defendant_names = defendants.map(d =>
      d.d_01 || d.d_02 || d.d_03 || d.d_04 || d.d_05 || 'Unknown'
    );

    const result = {
      rows: skiptraceData?.map(s => ({
        ...s,
        defendant_names,
        defendants
      })) || []
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching skip trace results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skip trace results' },
      { status: 500 }
    );
  }
}

function parseAddressToPropertyFormat(address: string): any {
  // Parse address string into components for BatchData API
  // Expected format: "street, city, state zip"
  const parts = address.split(',').map(part => part.trim());

  if (parts.length < 2) {
    // If not enough parts, return as is
    return {
      street: address.trim(),
      city: '',
      state: '',
      zip: ''
    };
  }

  const street = parts[0];

  // Parse city, state, zip from remaining parts
  let city = '';
  let state = '';
  let zip = '';

  if (parts.length === 3) {
    // Format: street, city, state zip
    city = parts[1];
    const stateZipParts = parts[2].split(/\s+/);
    if (stateZipParts.length >= 2) {
      state = stateZipParts[0];
      zip = stateZipParts[1];
    } else if (stateZipParts.length === 1) {
      // Could be just state or just zip
      if (/^\d{5}(-\d{4})?$/.test(stateZipParts[0])) {
        zip = stateZipParts[0];
      } else {
        state = stateZipParts[0];
      }
    }
  } else if (parts.length === 2) {
    // Format might be: street, city state zip
    const cityStateZip = parts[1].split(/\s+/);
    if (cityStateZip.length >= 3) {
      // Last item is likely zip, second to last is state
      zip = cityStateZip[cityStateZip.length - 1];
      state = cityStateZip[cityStateZip.length - 2];
      city = cityStateZip.slice(0, -2).join(' ');
    } else if (cityStateZip.length === 2) {
      // Could be "city state" or "state zip"
      if (/^\d{5}(-\d{4})?$/.test(cityStateZip[1])) {
        state = cityStateZip[0];
        zip = cityStateZip[1];
      } else {
        city = cityStateZip.join(' ');
      }
    } else {
      city = cityStateZip.join(' ');
    }
  }

  return {
    street: street,
    city: city,
    state: state,
    zip: zip
  };
}

async function processSkipTraceResults(docket_number: string, apiResponse: any, source: string) {
  const results = [];

  try {
    // Extract phone numbers from the BatchData API response structure
    // Response structure: { status: {...}, results: { persons: [...] } }
    let phoneNumbers = [];
    let emails = [];
    let personData = null;

    if (apiResponse.results && apiResponse.results.persons && apiResponse.results.persons.length > 0) {
      // Get the first person's data
      personData = apiResponse.results.persons[0];
      phoneNumbers = personData.phoneNumbers || [];
      emails = personData.emails || [];

      console.log(`Found ${phoneNumbers.length} phone numbers and ${emails.length} emails for docket ${docket_number}`);
    } else if (apiResponse.responses && apiResponse.responses[0]) {
      // Fallback to old response structure if present
      const response = apiResponse.responses[0];
      phoneNumbers = response.phoneNumbers || [];
      emails = response.emails || [];
    }

    // Store each phone number as a separate skip trace record
    for (const phone of phoneNumbers) {
      const phoneNumber = phone.number || phone;
      const phoneType = phone.type || 'Unknown';

      if (!supabase) {
        throw new Error('Database connection not available');
      }

      // Store phone number record
      const { data: insertData, error: insertError } = await supabase
        .from('skiptrace')
        .insert({
          docket_number,
          phone_number: phoneNumber,
          phone_type: phoneType,
          created_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('Error inserting skip trace record:', insertError);
        throw insertError;
      }

      if (insertData && insertData[0]) {
        results.push(insertData[0]);
      }
    }

    // If no phone numbers found, still store the attempt
    if (phoneNumbers.length === 0) {
      if (!supabase) {
        throw new Error('Database connection not available');
      }

      const { data: insertData, error: insertError } = await supabase
        .from('skiptrace')
        .insert({
          docket_number,
          phone_number: null,
          phone_type: 'No results',
          created_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('Error inserting skip trace record:', insertError);
        throw insertError;
      }

      if (insertData && insertData[0]) {
        results.push(insertData[0]);
      }
    }

  } catch (error) {
    console.error('Error processing skip trace results:', error);
    throw error;
  }

  return results;
}

// Helper function to generate sandbox data for testing
function generateSandboxData() {
  const phoneNumbers = [];
  const numPhones = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < numPhones; i++) {
    phoneNumbers.push({
      number: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      type: ['Mobile', 'Landline', 'VOIP'][Math.floor(Math.random() * 3)]
    });
  }

  return {
    responses: [{
      phoneNumbers,
      emails: [`test${Math.floor(Math.random() * 1000)}@example.com`],
      confidence: Math.random(),
      matchType: 'address'
    }]
  };
}