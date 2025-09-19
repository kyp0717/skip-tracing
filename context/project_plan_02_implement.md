# Project Plan - AE System for Scraping and Skip Tracing

## Project Overview
Build a web scraping and skip trace system that:
1. Scrapes foreclosure cases from Connecticut Judiciary website
2. Stores case and defendant data in vercel postgres database
3. Integrates with BatchData API for skip trace (phone lookup) services
4. Uses modern database schema with proper relationships
5. Levarage shadcn ui mcp to design and build web page
6. Leverage vercel mcp to deploy the website
6. To ensure clean deployment, the site with be build using nextjs, postgres serverless functions, etc.


## Implementation

### Phase 2 - Web Scraping ✅
- Implement Connecticut Judiciary site scraper
- Extract case information by town
- Parse defendant names and addresses
- Store town name with defendant records
-   **Target URL:** https://civilinquiry.jud.ct.gov/PropertyAddressSearch.aspx";
-   **Initial Data Extraction:** The first step will be to scrape this URL to obtain a list of court cases and their corresponding docket numbers for a specific town.
-   **Key HTML Tags (Anticipated):**
    *   `<table>`, `<tr>`, `<td>`: For extracting tabular data containing case information.
    *   `<form>`, `<input>`, `<select>`, `<option>`: For interacting with the town selection form.
    *   `<a>`: For extracting links to individual case details.

### Phase 3 - Database Integration ✅
- Create database models (Case, Defendant, SkipTrace)
- Implement CRUD operations
- Handle duplicate detection by docket_number
- Store scraped data with proper relationships

### Phase 4 - Skip Trace Integration (Pending)
- Integrate BatchData API (sandbox and production)
- Store skip trace results in `skiptrace` table
- Link phone numbers to defendants via defendant_id
- Support both sandbox and production environments

### Phase 5 - Testing & Validation ✅
- Unit tests for all components
- Integration tests with database
- Use uv for virtual environment management
- Colored test output (green/red)

## Key Design Decisions

1. **No case_id references**: System uses `docket_number` as the natural key for case-defendant relationships

2. **Town-based storage**: Defendants store the town name from the search, not parsed from address

3. **Simplified timestamps**: Only `created_at` is tracked, no `updated_at` or `search_date`

4. **SkipTrace naming**: Table renamed from `phone_numbers` to `skiptrace` to better reflect its purpose


## Environment Variables
```env

# BatchData API (Optional)
USE_SANDBOX=true
BATCHDATA_API_KEY=your_api_key_here
```

## Database Operations


### Data Models in db_models.py
- `Case` - Court case information
- `Defendant` - Defendant with town field
- `SkipTrace` - Phone lookup results (formerly PhoneNumber)
- `ScrapedCase` - Web scraper output model





## Success Metrics
- Successfully scrape all foreclosure cases for a given town
- Store complete case and defendant information
- Maintain data integrity with proper foreign key relationships
- Support both sandbox and production API environments
- All tests passing with proper virtual environment isolation
- Efficient duplicate detection using docket_number