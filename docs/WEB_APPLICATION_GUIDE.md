# Foreclosure Skip Trace Web Application

## Overview
A Flask-based web application for managing foreclosure cases, scraping data from Connecticut Judiciary website, and performing skip traces to find phone numbers for defendants.

## Features

### 1. Dashboard
- Overview of total cases, defendants, and phone numbers
- List of towns with cases
- Recent cases display
- Quick action buttons

### 2. Case Management
- View all cases with filtering by town
- See defendant counts and phone numbers per case
- Check skip trace status
- Detailed case view with all information

### 3. Web Scraping
- Scrape foreclosure cases from CT Judiciary website
- Select any Connecticut town
- Automatic duplicate detection
- Progress feedback

### 4. Skip Trace Integration
- Run skip traces for individual cases
- Support for both sandbox (test) and production modes
- Force re-processing option
- Real-time phone number lookup

## Installation

### Prerequisites
- Python 3.8+
- Supabase account with configured database
- `.env` file with database credentials

### Setup Steps

1. **Install dependencies:**
```bash
uv pip install -r requirements.txt
```

2. **Run database migration:**
   - Go to Supabase SQL Editor
   - Run the contents of `docs/SCHEMA_MIGRATION_V6_SIMPLE.sql`

3. **Configure environment:**
   - Ensure `.env` file contains:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   ```

4. **Start the application:**
```bash
uv run python src/web_app.py
```

5. **Access the application:**
   - Open browser to: http://localhost:5000

## Usage Guide

### Scraping Cases

1. Navigate to "Scrape" page
2. Enter a Connecticut town name (e.g., "Middletown")
3. Click "Start Scraping"
4. Wait for the process to complete
5. View scraped cases in the "Cases" page

### Running Skip Traces

#### From Cases List:
1. Go to "Cases" page
2. Find cases without skip traces
3. Click "Skip Trace" button
4. Choose production or sandbox mode
5. Confirm to run

#### From Case Detail:
1. Click on any case to view details
2. See existing phone numbers
3. Run new skip trace if needed
4. Choose between production (real API) or sandbox (test)

### API Endpoints

The application provides RESTful API endpoints:

- `GET /health` - Health check
- `GET /api/cases` - List all cases (optional: ?town=Middletown)
- `GET /api/case/<docket_number>` - Get case details
- `GET /api/stats/<town>` - Get town statistics
- `POST /skip-trace/<docket_number>` - Run skip trace

## Application Structure

```
src/
├── web_app.py              # Main Flask application
├── templates/              # HTML templates
│   ├── base.html          # Base template with navigation
│   ├── index.html         # Dashboard
│   ├── cases.html         # Cases list
│   ├── case_detail.html  # Individual case view
│   ├── scrape.html        # Scraping interface
│   └── error.html         # Error page
├── static/                 # Static assets
│   └── css/
│       └── style.css      # Custom styles
└── [other modules]         # Database, scraper, skip trace logic
```

## Key Features Explained

### Dashboard
- **Statistics Cards**: Real-time counts of cases, defendants, and phone numbers
- **Town List**: Quick navigation to cases by town
- **Recent Cases**: Latest 5 cases added to the system

### Cases Page
- **Filtering**: Filter cases by town name
- **Status Indicators**: Visual badges for defendant count, phone numbers, skip trace status
- **Quick Actions**: View details or run skip trace directly from the list

### Case Detail Page
- **Complete Information**: All case data including defendants and addresses
- **Dual Skip Trace**: Separate sections for production and sandbox results
- **Interactive Actions**: Run skip trace with configurable options

### Scraping Page
- **Town Selection**: Manual entry or quick-select popular towns
- **Progress Feedback**: Loading indicators during scraping
- **Result Summary**: Success/error messages with statistics

## Security Considerations

1. **API Keys**: Store in `.env` file, never commit to repository
2. **Database Access**: Use environment variables for credentials
3. **Production Mode**: The app uses debug mode for development - disable for production
4. **CORS**: Configured for API access from different origins

## Deployment

### Development
```bash
uv run python src/web_app.py
```

### Production with Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:5000 src.web_app:app
```

### Docker (Optional)
Create a Dockerfile:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "src.web_app:app"]
```

## Troubleshooting

### Database Connection Issues
- Verify `.env` file exists and contains correct credentials
- Check Supabase dashboard for service status
- Ensure database migrations have been run

### Scraping Failures
- Check internet connection
- Verify CT Judiciary website is accessible
- Check Chrome/Chromium driver installation

### Skip Trace Issues
- Verify BatchData API credentials in `batchapi.csv`
- Check if case has valid defendant addresses
- Use sandbox mode for testing without charges

## Cost Considerations

- **Scraping**: Free (uses public website)
- **Database**: Supabase free tier includes 500MB storage
- **Skip Trace**:
  - Sandbox: Free (returns mock data)
  - Production: $0.07 per address lookup

## Future Enhancements

1. **User Authentication**: Add login system for multi-user support
2. **Bulk Operations**: Process multiple cases at once
3. **Export Features**: Download cases as CSV/Excel
4. **Scheduling**: Automated daily/weekly scraping
5. **Analytics Dashboard**: Advanced statistics and charts
6. **Email Notifications**: Alert when new cases are found
7. **Mobile Responsive**: Improve mobile experience

## Testing

Run the application and test:

1. **Health Check**: `curl http://localhost:5000/health`
2. **View Dashboard**: Open http://localhost:5000
3. **Scrape Test**: Try scraping "Middletown"
4. **Skip Trace Test**: Run sandbox skip trace on any case

## Support

For issues or questions:
1. Check the logs in the terminal
2. Verify database connection
3. Ensure all dependencies are installed
4. Check Supabase dashboard for quota limits