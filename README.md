# BatchData Skip Tracing Application

A Python application for performing property skip tracing using the BatchData API to find property owner contact information.

## Features

- **Batch Processing**: Process multiple properties from CSV files
- **Multiple Export Formats**: Save results as CSV or Excel files
- **Sandbox/Production Modes**: Test with mock data or use live API

## Installation

1. Install required dependencies:
```bash
pip install -r requirements.txt
```

2. API Configuration:
   - The application reads API tokens from `batchapi.csv` file
   - The CSV contains separate tokens for sandbox and production environments
   - Tokens are automatically selected based on the `USE_SANDBOX` setting

3. (Optional) Configure environment settings:
```bash
cp .env.example .env
```

Edit `.env` to control sandbox/production mode:
```
USE_SANDBOX=true  # Set to false for production
```

## Usage

### Batch Processing from CSV

```bash
# Process properties from CSV file
python main.py --input sample_properties.csv --output results.csv

# Export as Excel file
python main.py --input sample_properties.csv --output results.xlsx --format excel
```

### Input CSV Format

Your input CSV file must contain these columns:
- `street` - Street address
- `city` - City name
- `state` - State abbreviation (2 letters)
- `zip` - ZIP code

Example:
```csv
street,city,state,zip
1011 Rosegold St,Franklin Square,NY,11010
25866 W Globe Ave,Buckeye,AZ,85326
```

### Output Fields

The application returns the following information:
- Owner name (first and last)
- Property address details
- Phone numbers (up to 3, filtered by score and reachability)
- Email address
- Property equity information
- Absentee owner status
- Vacancy status
- USPS deliverability

## Command Line Options

- `--input`: Input CSV file path (required)
- `--output`: Output file path (default: `skip_trace_results.csv`)
- `--format`: Output format (`csv` or `excel`)
- `--api-key`: Override API key from command line

## API Configuration

The application uses the following endpoint:
- **Skip Trace**: `/property/skip-trace` - Retrieves owner information

### Sandbox vs Production

- **Sandbox Mode**: Uses mock data for testing (no API credits consumed)
- **Production Mode**: Uses live data (consumes API credits)

The application automatically selects the appropriate API token from `batchapi.csv`:
- Sandbox token is used when `USE_SANDBOX=true`
- Production token is used when `USE_SANDBOX=false`

Configure in `.env` file:
```
USE_SANDBOX=true   # For testing with mock data
USE_SANDBOX=false  # For production use
```

## Project Structure

```
skip-tracing-gemini/
├── src/
│   ├── case.py              # Case class
│   ├── court_case_scraper.py # Scraper for court cases
│   ├── api_client.py      # BatchData API wrapper
│   ├── skip_tracer.py     # Skip trace business logic
│   ├── utils.py           # Utility functions
│   └── main.py            # Main application
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── .env.example          # Example environment file
├── sample_properties.csv  # Sample input file
└── README.md             # Documentation
```

## Web Scraping

The application uses Selenium to scrape data from the Connecticut Judicial Branch website. You will need to have Google Chrome and the correct version of chromedriver installed and in your PATH.



## Error Handling

The application includes:
- Automatic retry logic for API failures
- Input validation for addresses
- Detailed error messages

## Requirements

- Python 3.7+
- BatchData API key
- Dependencies listed in `requirements.txt`

## License

This project is for educational and business use with proper BatchData API licensing.