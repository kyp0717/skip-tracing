# Vercel Deployment Guide

## Architecture Overview
This project uses a hybrid approach:
- **Frontend**: React/Vite app served as static files
- **Backend**: Python serverless functions for API endpoints
- **Database**: Supabase (works perfectly with serverless)

## Project Structure
```
/
├── api/                    # Python serverless functions
│   ├── _db.py             # Shared database connection
│   ├── requirements.txt   # Python dependencies
│   ├── cases/
│   │   ├── index.py       # GET /api/cases
│   │   └── [id].py        # GET /api/cases/:id
│   └── skiptraces/
│       └── lookup.py      # POST /api/skiptraces/lookup
├── frontend/              # React/Vite application
├── vercel.json           # Vercel configuration
└── package.json          # Root package with deployment scripts
```

## Setup Instructions

### 1. Install Dependencies
```bash
# Install Vercel CLI globally
npm install -g vercel

# Install all dependencies
npm run install:all
```

### 2. Set Environment Variables
Create a `.env` file based on `.env.example`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Configure Vercel Environment
```bash
# Login to Vercel
vercel login

# Link to Vercel project (first time only)
vercel link

# Set environment variables in Vercel
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

### 4. Local Development
```bash
# Run locally with Vercel CLI (recommended)
npm run dev
# or
vercel dev

# This will:
# - Serve frontend on localhost:3000
# - Run Python functions as serverless
# - Handle all routing properly
```

### 5. Deploy to Vercel
```bash
# Deploy to preview
npm run preview
# or
vercel

# Deploy to production
npm run deploy
# or
vercel --prod
```

## API Endpoints

All API endpoints are now serverless functions:

- `GET /api/cases` - List all cases
- `GET /api/cases/:id` - Get single case
- `POST /api/skiptraces/lookup` - Perform skip trace

## Key Changes from FastAPI

1. **No FastAPI server** - Each endpoint is a standalone function
2. **Stateless** - Each request creates new database connection (cached)
3. **CORS handled** - Each function includes CORS headers
4. **Path parameters** - Handled via filename patterns like `[id].py`

## Adding New Endpoints

To add a new endpoint:

1. Create a new Python file in `/api` directory
2. Use the handler class pattern:
```python
from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"message": "Hello"}).encode())
```

3. Import shared database from `_db.py`
4. Deploy with `vercel`

## Troubleshooting

### Python Dependencies
- Add to `/api/requirements.txt`
- Vercel automatically installs them

### Database Connection
- Use connection pooling via `@lru_cache`
- Keep connections light for serverless

### CORS Issues
- Each handler must include CORS headers
- Handle OPTIONS requests for preflight

## Production Considerations

1. **Environment Variables** - Set via Vercel dashboard
2. **Custom Domain** - Configure in Vercel settings
3. **Rate Limiting** - Consider Vercel's limits
4. **Monitoring** - Use Vercel Analytics

## Commands Summary
```bash
npm run dev        # Local development
npm run preview    # Deploy preview
npm run deploy     # Deploy production
```