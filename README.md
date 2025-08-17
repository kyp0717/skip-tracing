# BatchData Skip Tracing Application

A Python application for performing property skip tracing using the BatchData API to find property owner contact information.

## Features

- **Single Property Lookup**: Process individual property addresses
- **Batch Processing**: Process multiple properties from CSV files
- **Multiple Export Formats**: Save results as CSV or Excel files
- **Sandbox/Production Modes**: Test with mock data or use live API

## Installation

1. Install required dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your API credentials:
```bash
cp .env.example .env
```

3. Edit `.env` and add your BatchData API key:
```
BATCHDATA_API_KEY=your_api_key_here
USE_SANDBOX=true  # Set to false for production
```

## Usage

### Single Property Lookup

```bash
python main.py --mode single \
  --street "1011 Rosegold St" \
  --city "Franklin Square" \
  --state "NY" \
  --zip "11010"
```

### Batch Processing from CSV

```bash
# Process properties from CSV file
python main.py --mode batch \
  --input sample_properties.csv \
  --output results.csv

# Export as Excel file
python main.py --mode batch \
  --input sample_properties.csv \
  --output results.xlsx \
  --format excel
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

- `--mode`: Processing mode (`single` or `batch`)
- `--street`: Street address (single mode)
- `--city`: City (single mode)
- `--state`: State abbreviation (single mode)
- `--zip`: ZIP code (single mode)
- `--input`: Input CSV file path (batch mode)
- `--output`: Output file path (default: `skip_trace_results.csv`)
- `--format`: Output format (`csv` or `excel`)
- `--api-key`: Override API key from command line

## API Configuration

The application uses the following endpoint:
- **Skip Trace**: `/property/skip-trace` - Retrieves owner information

### Sandbox vs Production

- **Sandbox Mode**: Uses mock data for testing (no API credits consumed)
- **Production Mode**: Uses live data (consumes API credits)

Configure in `.env` file:
```
USE_SANDBOX=true   # For testing with mock data
USE_SANDBOX=false  # For production use
```

## Project Structure

```
skip-tracing/
├── src/
│   ├── api_client.py      # BatchData API wrapper
│   ├── skip_tracer.py     # Skip trace business logic
│   └── utils.py           # Utility functions
├── config.py              # Configuration settings
├── main.py                # CLI application
├── requirements.txt       # Python dependencies
├── .env.example          # Example environment file
├── sample_properties.csv  # Sample input file
└── README.md             # Documentation
```

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