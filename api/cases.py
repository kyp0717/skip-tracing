"""
Cases API endpoint for Vercel
Single file for cases endpoints
"""

from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs
import os

# Try to load .env file for local development
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not available in production

from supabase import create_client

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests for cases"""
        try:
            # Parse URL and query parameters
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)

            # Get pagination parameters
            skip = int(query_params.get('skip', ['0'])[0])
            limit = int(query_params.get('limit', ['10'])[0])
            town = query_params.get('town', [None])[0]

            # Get Supabase client
            url = os.environ.get("SUPABASE_URL")
            key = os.environ.get("SUPABASE_ANON_KEY")

            if not url or not key:
                # Send detailed error for debugging
                error_detail = {
                    "error": "Missing Supabase credentials",
                    "has_url": bool(url),
                    "has_key": bool(key),
                    "hint": "Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env file"
                }
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(error_detail).encode())
                return

            client = create_client(url, key)

            # Build query
            query = client.table('cases').select("*")

            # Apply town filter if provided
            if town:
                query = query.eq('town', town)

            # Get total count
            count_response = query.execute()
            total = len(count_response.data) if count_response.data else 0

            # Apply pagination
            query = query.range(skip, skip + limit - 1)
            response = query.execute()

            # Prepare response data
            result = {
                "items": response.data if response.data else [],
                "total": total,
                "skip": skip,
                "limit": limit,
                "has_more": (skip + limit) < total
            }

            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

        except Exception as e:
            # Error response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()