"""
Test API endpoint to verify Vercel functions are working
"""

from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests for test"""

        # Check if environment variables are loaded
        has_supabase_url = bool(os.environ.get("SUPABASE_URL"))
        has_supabase_key = bool(os.environ.get("SUPABASE_ANON_KEY"))

        result = {
            "status": "API is working",
            "environment": {
                "SUPABASE_URL_configured": has_supabase_url,
                "SUPABASE_KEY_configured": has_supabase_key,
                "NODE_ENV": os.environ.get("NODE_ENV", "not set")
            },
            "message": "Test endpoint is functional"
        }

        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(result, indent=2).encode())

    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()