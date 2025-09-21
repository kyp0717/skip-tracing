import { NextRequest, NextResponse } from 'next/server';

// Mock BatchData response for testing without API key
const mockBatchDataResponse = {
  responses: [{
    phoneNumbers: [
      { number: '(555) 123-4567', type: 'Mobile' },
      { number: '(555) 987-6543', type: 'Landline' }
    ],
    emails: [
      'test@example.com'
    ],
    owner: {
      name: 'Test Owner',
      mailingAddress: '123 Main St, Hartford, CT 06103'
    },
    confidence: 0.85,
    dataSource: 'Mock Data'
  }]
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { defendant_id, address, name, use_real_api = false } = body;

    // Validate required fields
    if (!defendant_id || !address) {
      return NextResponse.json(
        { error: 'defendant_id and address are required' },
        { status: 400 }
      );
    }

    // If use_real_api is true, forward to real BatchData endpoint
    if (use_real_api) {
      const response = await fetch(
        `${request.nextUrl.origin}/api/batchdata`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ defendant_id, address, name })
        }
      );

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // Generate mock data based on input
    const mockResponse = {
      ...mockBatchDataResponse,
      responses: [{
        ...mockBatchDataResponse.responses[0],
        owner: {
          name: name || 'Test Owner',
          mailingAddress: address
        },
        phoneNumbers: [
          {
            number: generateMockPhone(),
            type: Math.random() > 0.5 ? 'Mobile' : 'Landline'
          },
          ...(Math.random() > 0.5 ? [{
            number: generateMockPhone(),
            type: 'Work'
          }] : [])
        ]
      }]
    };

    // Store mock results in database
    const storeResponse = await fetch(
      `${request.nextUrl.origin}/api/skiptrace`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          defendant_id,
          phone_number: mockResponse.responses[0].phoneNumbers[0].number,
          phone_type: mockResponse.responses[0].phoneNumbers[0].type,
          source: 'sandbox',
          api_response: mockResponse
        })
      }
    );

    if (!storeResponse.ok) {
      console.warn('Failed to store mock skip trace data');
    }

    return NextResponse.json({
      success: true,
      source: 'mock',
      message: 'Mock skip trace data generated for testing',
      results: mockResponse
    });

  } catch (error) {
    console.error('Error in test skip trace:', error);
    return NextResponse.json(
      { error: 'Failed to generate test data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Test connection and API key
export async function GET(request: NextRequest) {
  const hasApiKey = !!process.env.BATCHDATA_API_KEY;
  const useSandbox = process.env.USE_SANDBOX === 'true';

  return NextResponse.json({
    status: 'ready',
    api_key_configured: hasApiKey,
    mode: useSandbox ? 'sandbox' : 'production',
    test_endpoint: '/api/batchdata/test',
    real_endpoint: '/api/batchdata',
    batch_endpoint: '/api/defendants/skip-trace',
    instructions: {
      test: 'POST to this endpoint with defendant_id and address to get mock data',
      real: 'POST to /api/batchdata with defendant_id and address to use real API',
      batch: 'POST to /api/defendants/skip-trace with docket_number to process multiple defendants'
    }
  });
}

function generateMockPhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${prefix}-${lineNumber}`;
}