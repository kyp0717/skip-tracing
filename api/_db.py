"""
Shared database connection for Vercel serverless functions
"""

import os
from supabase import create_client, Client
from functools import lru_cache

@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Get a cached Supabase client instance
    Uses environment variables from Vercel
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_ANON_KEY")

    return create_client(url, key)