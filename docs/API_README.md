# Skip Trace Database REST API

## Overview

The Skip Trace Database API is a RESTful API built with FastAPI that provides comprehensive access to Connecticut foreclosure case data, defendant information, skip trace results, and town/county reference data.

## Features

- **Complete CRUD Operations**: Full Create, Read, Update, Delete for all entities
- **Automatic Documentation**: Interactive API docs at `/docs` (Swagger UI) and `/redoc`
- **Data Validation**: Pydantic models ensure data integrity
- **Pagination & Filtering**: Efficient data retrieval with built-in pagination
- **Background Tasks**: Asynchronous scraping operations
- **Type Safety**: Full type hints and validation

## Quick Start

### Installation

```bash
# Install dependencies
uv pip install -r requirements.txt

# Or using pip
pip install -r requirements.txt
```

### Running the API

```bash
# Using the run script
python run_api.py

# Or directly with uvicorn
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# Or with uv
uv run python run_api.py
```

The API will be available at `http://localhost:8000`

### Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Cases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cases/` | List all cases (paginated) |
| GET | `/api/v1/cases/search` | Search cases by name or docket |
| GET | `/api/v1/cases/by-town/{town}` | Get cases by town |
| GET | `/api/v1/cases/{docket_number}` | Get single case with defendants |
| POST | `/api/v1/cases/` | Create new case |
| PUT | `/api/v1/cases/{docket_number}` | Update case |
| DELETE | `/api/v1/cases/{docket_number}` | Delete case |

### Defendants

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/defendants/` | List all defendants (paginated) |
| GET | `/api/v1/defendants/by-case/{docket}` | Get defendants by case |
| GET | `/api/v1/defendants/{id}` | Get single defendant |
| POST | `/api/v1/defendants/` | Create new defendant |
| PUT | `/api/v1/defendants/{id}` | Update defendant |
| DELETE | `/api/v1/defendants/{id}` | Delete defendant |

### Skip Traces

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/skiptraces/lookup` | Perform skip trace lookup |
| GET | `/api/v1/skiptraces/history` | Get skip trace history |
| GET | `/api/v1/skiptraces/by-defendant/{id}` | Get traces by defendant |
| GET | `/api/v1/skiptraces/costs` | Get cost summary |
| DELETE | `/api/v1/skiptraces/{id}` | Delete skip trace |

### Connecticut Towns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/towns/` | List all CT towns |
| GET | `/api/v1/towns/counties` | List all counties with stats |
| GET | `/api/v1/towns/by-county/{county}` | Get towns by county |
| GET | `/api/v1/towns/search` | Fuzzy search towns |
| GET | `/api/v1/towns/validate/{name}` | Validate town name |
| POST | `/api/v1/towns/populate` | Populate towns data |
| POST | `/api/v1/towns/refresh` | Refresh towns data |

### Scraper

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/scraper/scrape` | Start scraping job |
| GET | `/api/v1/scraper/status/{job_id}` | Get job status |
| GET | `/api/v1/scraper/history` | Get scraping history |
| POST | `/api/v1/scraper/scrape-all-towns` | Scrape all CT towns |

## Example Usage

### Using cURL

```bash
# Get all cases for Middletown
curl "http://localhost:8000/api/v1/cases/by-town/Middletown"

# Search for cases
curl "http://localhost:8000/api/v1/cases/search?q=foreclosure"

# Validate a town name
curl "http://localhost:8000/api/v1/towns/validate/Hartford"

# Start a scraping job
curl -X POST "http://localhost:8000/api/v1/scraper/scrape" \
  -H "Content-Type: application/json" \
  -d '{"town": "Middletown", "store_in_db": true}'
```

### Using Python (httpx)

```python
import httpx

# Create a client
client = httpx.Client(base_url="http://localhost:8000")

# Get all towns
response = client.get("/api/v1/towns/")
towns = response.json()

# Search cases
response = client.get("/api/v1/cases/search", params={"q": "Smith"})
cases = response.json()

# Create a new case
new_case = {
    "case_name": "Bank vs Smith",
    "docket_number": "CV-2024-001",
    "town": "Hartford"
}
response = client.post("/api/v1/cases/", json=new_case)
```

### Using JavaScript (fetch)

```javascript
// Get all counties
fetch('http://localhost:8000/api/v1/towns/counties')
  .then(response => response.json())
  .then(data => console.log(data));

// Start a scraping job
fetch('http://localhost:8000/api/v1/scraper/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    town: 'New Haven',
    store_in_db: true
  })
})
.then(response => response.json())
.then(data => console.log('Job started:', data));
```

## Pagination

Most list endpoints support pagination with `skip` and `limit` parameters:

```bash
# Get first 10 cases
curl "http://localhost:8000/api/v1/cases/?skip=0&limit=10"

# Get next 10 cases
curl "http://localhost:8000/api/v1/cases/?skip=10&limit=10"
```

Response format:
```json
{
  "items": [...],
  "total": 100,
  "skip": 0,
  "limit": 10,
  "has_more": true
}
```

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "detail": "Error message here"
}
```

## Health Check

Check API and database health:

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "services": {
    "api": "healthy",
    "database": "healthy"
  }
}
```

## Environment Variables

Create a `.env` file with:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# BatchData API (Optional)
BATCHDATA_API_KEY=your_api_key
USE_SANDBOX=true
```

## Development

### Running Tests

```bash
# Run API tests
uv run python tests/test_api.py
```

### Adding New Endpoints

1. Create schema in `src/api/v1/schemas/`
2. Create endpoint in `src/api/v1/endpoints/`
3. Include router in `src/api/main.py`

## Production Deployment

### Using Gunicorn with Uvicorn Workers

```bash
gunicorn src.api.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## API Rate Limiting

In production, consider adding rate limiting:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/v1/cases/")
@limiter.limit("100/minute")
async def list_cases():
    ...
```

## Security Considerations

1. **CORS**: Configure allowed origins in production
2. **Authentication**: Add JWT or API key authentication
3. **Rate Limiting**: Prevent abuse with rate limits
4. **Input Validation**: Pydantic models validate all inputs
5. **SQL Injection**: Supabase client prevents SQL injection

## Support

For issues or questions:
- Check the interactive docs at `/docs`
- Review error messages in API responses
- Check database connectivity with `/health` endpoint

## License

This API is part of the Skip Trace Database project.