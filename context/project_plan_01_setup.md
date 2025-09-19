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


## Database Schema

### Cases Table
```sql
CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    case_name VARCHAR(255) NOT NULL,
    docket_number VARCHAR(100) UNIQUE NOT NULL,  -- Primary reference key
    docket_url TEXT,
    town VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
```
- **Key Changes**:
  - Removed `search_date` and `updated_at` fields
  - `docket_number` serves as unique identifier for relationships

### Defendants Table
```sql
CREATE TABLE defendants (
    id SERIAL PRIMARY KEY,
    docket_number VARCHAR(100) NOT NULL REFERENCES cases(docket_number) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    town VARCHAR(100),  -- Changed from 'city' to 'town'
    state VARCHAR(2),
    zip VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(docket_number, name)
);
```
- **Key Changes**:
  - Uses `docket_number` as foreign key (not case_id)
  - Changed `city` field to `town` to match scraping data
  - Town is populated from the search parameter

### SkipTrace Table 
```sql
CREATE TABLE skiptrace (
    id SERIAL PRIMARY KEY,
    defendant_id INTEGER REFERENCES defendants(id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    phone_type VARCHAR(50),
    source VARCHAR(20) CHECK (source IN ('sandbox', 'production')),
    api_response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```
- **Key Changes**:
  - Renamed from `phone_numbers` to `skiptrace`
  - Stores complete skip trace results including API responses



## Implementation Phases

### Phase 1 - Deploy basic app to Vercel ✅ COMPLETED

#### Completed Pipeline Implementation (2025-09-18)

**1. Project Setup & Dependencies**
- Created Next.js 14.2.18 application with TypeScript support
- Configured package.json with necessary dependencies:
  - `@vercel/postgres` for database connectivity
  - `playwright` for web scraping
  - `tailwindcss` for styling
  - TypeScript development dependencies

**2. Database Implementation**
- Created Vercel Postgres connection module (`app/lib/db.ts`)
- Implemented database migration script (`scripts/migrate.mjs`)
- Schema includes three main tables:
  - `cases`: Stores foreclosure case information
  - `defendants`: Stores defendant details linked by docket_number
  - `skiptrace`: Stores phone lookup results

**3. API Routes Created**
- `/api/cases`: GET/POST operations for case management
- `/api/defendants`: GET/POST operations for defendant records
- `/api/skiptrace`: GET/POST operations for skip trace results
- `/api/scrape`: POST endpoint for web scraping functionality

**4. Web Scraping Module**
- Implemented `CTJudiciaryScaper` class using Playwright
- Functions for scraping cases by town
- Functions for extracting defendant information from case pages

**5. Frontend Components**
- Home page with navigation cards
- Scrape form component for initiating scraping
- Cases list component for viewing data
- Tailwind CSS styling throughout

**6. Project Structure**
```
skip-trace-vercel/
├── app/
│   ├── api/           # API routes
│   ├── components/    # React components
│   ├── lib/          # Utilities and database
│   ├── cases/        # Cases page
│   ├── scrape/       # Scrape page
│   └── layout.tsx    # Root layout
├── scripts/
│   └── migrate.mjs   # Database migration
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
├── tailwind.config.js # Tailwind config
└── vercel.json       # Vercel deployment config
```

**7. Deployment Configuration**
- Vercel.json configured for Next.js deployment
- Environment variables structure defined (.env.example)
- Build successfully tested locally
- Ready for Vercel deployment

**Deployment Status:** ✅ DEPLOYED TO PRODUCTION

**Production URL:** https://skip-trace-vercel-9jf0b00fk-phage-kys-projects.vercel.app

**Deployment Steps Completed:**
1. ✅ Linked project to Vercel CLI
2. ✅ Pulled environment variables from Vercel
3. ✅ Deployed to preview environment
4. ✅ Deployed to production environment
5. ⏳ Database migration pending (run after verifying deployment)

**Next Steps:**
- Phase 2: Enhance scraping capabilities
- Phase 3: Implement BatchData API integration
- Phase 4: Add advanced UI features
