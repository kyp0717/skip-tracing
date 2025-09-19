# Project Plan - AE System for Scraping and Skip Tracing

## Project Overview
Build a web scraping and skip trace system that:
1. Scrapes foreclosure cases from Connecticut Judiciary website
2. Stores case and defendant data in Supabase database
3. Integrates with BatchData API for skip trace (phone lookup) services
4. Uses modern database schema with proper relationships
5. Leverage shadcn UI components for modern web interface
6. Deploy on Vercel platform
7. Built using Next.js 14, TypeScript, and serverless functions


## Implementation Status (Updated: 2025-09-19)

### Phase 1 - Initial Setup & Deployment ✅ COMPLETED
- Created Next.js 14.2.18 application with TypeScript
- Configured Tailwind CSS for styling
- Set up Vercel deployment configuration
- Implemented database connection with Supabase
- Created migration scripts for database schema
- Successfully deployed to Vercel production

### Phase 2 - Web Scraping ✅ COMPLETED
- Implemented Connecticut Judiciary site scraper using Playwright
- Extract case information by town with successful parsing
- Parse defendant names and addresses from case pages
- Store town name with defendant records
- **Target URL:** https://civilinquiry.jud.ct.gov/PropertyAddressSearch.aspx
- **Tested Results:**
    * Successfully scraped Bethel: 21 cases, 217 defendants
    * Successfully scraped Andover: 7 cases, 68 defendants
- **Key Features Implemented:**
    * Scrape by individual town
    * Scrape by county (all towns in county)
    * Automatic defendant extraction from case details

### Phase 3 - Database Integration ✅ COMPLETED
- Migrated from Vercel Postgres to Supabase for better reliability
- Created database models (Case, Defendant, SkipTrace)
- Implemented CRUD operations with proper error handling
- Handle duplicate detection by docket_number
- Store scraped data with proper relationships
- **Database Tables:**
    * `cases` - Stores case information with unique docket numbers
    * `defendants` - Linked to cases via docket_number
    * `skiptrace` - Ready for phone lookup integration
    * `ct_towns` - Connecticut towns reference data

### Phase 4 - UI/UX Enhancements ✅ COMPLETED (2025-09-19)
- **Landing Page Redesign:**
    * Professional header with "AE Solutions" branding
    * Subtle gray color scheme with less contrast
    * Removed view cases card as requested
    * Two-card layout for core functionality
    * Responsive design with hover effects

- **Advanced Scraping Interface:**
    * Tabbed interface with 4 options:
        - Scrape by Town
        - Scrape by County
        - View by Town (existing data)
        - View by County (existing data)
    * Dynamic dropdowns that only show towns with existing cases for view tabs
    * Real-time loading states and error handling
    * Success indicators with case/defendant counts

- **Data Table Implementation:**
    * Integrated TanStack Table (React Table) for data display
    * Shadcn-styled components
    * Features implemented:
        - Sortable columns (Case Name, Docket Number)
        - Pagination (10 items per page)
        - Clickable docket numbers (when URL available)
        - Clean, professional table design
    * Displays case details when viewing by town/county

### Phase 5 - API & Backend Improvements ✅ COMPLETED
- **Database Migration:**
    * Successfully migrated from Vercel Postgres to Supabase
    * Improved error handling and fallback mechanisms
    * Dual database support (Supabase primary, Vercel Postgres fallback)

- **API Endpoints Created:**
    * `/api/cases` - GET cases by town or county
    * `/api/cases/available-locations` - Get towns/counties with existing cases
    * `/api/scrape` - POST to scrape by town or county
    * `/api/defendants` - Manage defendant records
    * `/api/towns` - Get Connecticut towns list

- **Performance Optimizations:**
    * Batch processing for county-wide scraping
    * Efficient duplicate detection using upsert operations
    * Proper connection pooling and resource management

### Phase 6 - Skip Trace Integration 🔄 PENDING
- Integrate BatchData API (sandbox and production)
- Store skip trace results in `skiptrace` table
- Link phone numbers to defendants via defendant_id
- Support both sandbox and production environments

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