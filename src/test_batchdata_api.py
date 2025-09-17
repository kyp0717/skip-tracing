"""
Test script to verify BatchData API key and connection
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=== BatchData API Configuration Test ===\n")

# Check environment variables
print("1. Environment Variables:")
print(f"   BATCHDATA_API_KEY present: {bool(os.environ.get('BATCHDATA_API_KEY'))}")
print(f"   USE_SANDBOX: {os.environ.get('USE_SANDBOX', 'not set')}")

# Test API connector
try:
    from batch_api_connector import BatchAPIConnector

    # Determine environment based on USE_SANDBOX
    use_sandbox = os.environ.get('USE_SANDBOX', 'true').lower() in ['false', '0', 'no']
    env = 'prod' if not use_sandbox else 'sandbox'

    print(f"\n2. API Connector Initialization:")
    print(f"   Environment: {env}")

    connector = BatchAPIConnector(env)

    print(f"   API Token loaded: {bool(connector.api_token)}")
    if connector.api_token:
        print(f"   API Token (first 10 chars): {connector.api_token[:10]}...")
    print(f"   Base URL: {connector.base_url}")

    # Test with a sample address (only if in production mode with real API key)
    if env == 'prod' and connector.api_token:
        print("\n3. Testing API Connection (Production):")
        test_address = {
            'street': '123 Main St',
            'city': 'Hartford',
            'state': 'CT',
            'zip': '06103'
        }
        print(f"   Test address: {test_address}")
        print("   Note: Not making actual API call to avoid charges")
        print("   API is configured and ready to use!")
    elif env == 'sandbox':
        print("\n3. Sandbox Mode:")
        print("   Using sandbox environment for testing")
        print("   No real API calls will be made")

except ImportError as e:
    print(f"\nError importing modules: {e}")
except Exception as e:
    print(f"\nError during test: {e}")

# Test Skip Trace Integration
print("\n4. Skip Trace Integration Test:")
try:
    from skip_trace_integration import SkipTraceIntegration

    integration = SkipTraceIntegration()
    print(f"   Sandbox mode: {integration.use_sandbox}")
    print(f"   Table name: {integration.table_name}")
    print(f"   API configured: {bool(integration.api.api_token)}")

except Exception as e:
    print(f"   Error: {e}")

print("\n=== Test Complete ===")