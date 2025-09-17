"""
Simple test script to verify Supabase connection
Run this directly with Python to test
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Get credentials
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

print("=== Environment Check ===")
print(f"SUPABASE_URL present: {bool(url)}")
print(f"SUPABASE_KEY present: {bool(key)}")

if url and key:
    print("\n=== Testing Supabase Connection ===")
    try:
        from supabase import create_client
        client = create_client(url, key)

        # Try to get cases
        response = client.table('cases').select("*").limit(5).execute()
        print(f"Connection successful!")
        print(f"Found {len(response.data)} cases (showing max 5)")

        if response.data:
            print("\nFirst case:")
            import json
            print(json.dumps(response.data[0], indent=2))
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
else:
    print("\n❌ Missing credentials. Check your .env.local file")