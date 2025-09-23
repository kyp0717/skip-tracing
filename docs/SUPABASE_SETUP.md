# Supabase Setup Guide

## 1. Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create a new project:
   - Project name: `skip-trace` (or your preference)
   - Database Password: **SAVE THIS - you'll need it**
   - Region: Choose closest to you (e.g., East US)
   - Plan: Free tier

## 2. Get Your API Credentials

Once your project is created (takes ~2 minutes):

1. Go to Settings → API
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (Keep this SECRET!)

## 3. Database Schema

Run this SQL in the Supabase SQL Editor (SQL icon in left sidebar):

```sql
-- Create cases table
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    case_name VARCHAR(255) NOT NULL,
    docket_number VARCHAR(100) UNIQUE NOT NULL,
    docket_url TEXT,
    town VARCHAR(100),
    search_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create defendants table
CREATE TABLE defendants (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create phone_numbers table
CREATE TABLE phone_numbers (
    id SERIAL PRIMARY KEY,
    defendant_id INTEGER REFERENCES defendants(id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    phone_type VARCHAR(50),
    source VARCHAR(20) CHECK (source IN ('sandbox', 'production')),
    api_response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_cases_docket ON cases(docket_number);
CREATE INDEX idx_cases_town ON cases(town);
CREATE INDEX idx_defendants_case ON defendants(case_id);
CREATE INDEX idx_phone_defendant ON phone_numbers(defendant_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 4. Environment Variables

Add these to your `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Optional, for admin operations
```

## 5. Python Installation

```bash
pip install supabase
```

## 6. Test Connection

Run this Python script to test your connection:

```python
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

# Test query
response = supabase.table('cases').select("*").limit(1).execute()
print("Connection successful!" if response else "Connection failed")
```

## Security Notes

- **NEVER** commit your `.env` file to git
- **NEVER** expose your `service_role` key in client-side code
- Use Row Level Security (RLS) for production apps
- The `anon` key is safe for client-side use (it's meant to be public)

## Useful Supabase Features

1. **Table Editor**: Visual interface to view/edit data
2. **SQL Editor**: Run SQL queries directly
3. **API Docs**: Auto-generated documentation for your tables
4. **Logs**: Monitor database activity
5. **Authentication**: Built-in auth if needed later

## Connection Limits (Free Tier)

- 500MB database storage
- 2GB bandwidth
- 50,000 API requests/month
- 500 concurrent connections
- Pauses after 1 week of inactivity (can unpause anytime)