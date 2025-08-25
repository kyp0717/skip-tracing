# Project Plan

## AI Directive
1. Create comprehensive project plan (if not already exisit)
2. If project plan already exist, modify and update as work progress.
3. Modify and update tasks.md as needed as project progess.
4. Utilize sub agents for specific tasks

## Goal
- Build a web scraper in python.
- First the web scraper will scrape a civil inquiry site from Connecticut Judiciary to get a list of court cases with docket number by town.
- Use the docket number to scrape the for the defendant name and address 
- Once the name and address and discovered, the name and address will be use to search for phone number in a people search site
- Finally, return the name and phone numbers.

- Build a python script to perform skip tracing tasks.
- The script will take a csv file of property addresses.
- Use the addresses to search for the owner's name and contact information.
- The script will use an API to perform the skip tracing.
- Finally, return a csv file with the owner's name and contact information.

## Phase 1 - Implement Web Scraper
- Follow the example provide in `example/src` which implement the scraping in rust.
- Reimplement web scrape for case docket number from Connecticut Judicial Site 
   1. Implement case class inside `case.py` file
   2. Create a file call `court_case_scraper.py` 
     * implement CaseScraper class

## Phase 2 - Skip Tracing
- Implement a python script to use property addresses derived from web scraping in phase 1.
- Implement a python script to connect to a skip tracing API.
- Implement a python script to process the data from the API.
- Implement a python script to orchestrate the entire skip tracing process.

## Phase 3 
- Implement a python script to write the results to a csv file.

## Phase 4 Test
- Perform all test in a virtual environment using uv.

