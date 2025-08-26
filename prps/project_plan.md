# Project Plan

## AI Directive
1. Create comprehensive project plan (if not already exisit)
2. If project plan already exist, modify and update as work progress.
3. Modify and update tasks.md as needed as project progess.
4. Utilize sub agents for specific tasks
5. Run all tests in virtual environment using uv.


## Goal
- Build a web scraper in python.
- Scraper will scrape a CT Judiciary civil inquiry site to get a list of court cases by town.
- Use the docket number to scrape the for the defendant name and address 


## Phase 1 - Requirements
- Create a file in folder /prps/ call requirements.md
- In the requirements, explain what are the technical requirements that are needed for development of a scraper using python.
- For example, if selenium is required for this development, explain its purposes.
- In another section, list the python packages that are needed and why this is required.
- In another section, list the api and url that are used for scraping. In this section, include the tags that are used.
- Please feel free to add additional sections to explain anything else.
- When this phase is completed, log a summary of what has been done in phase and save with format phase_log_yyyymmdd.md
- Save the log file in `/log`.  If folder does not exist, create one.

## Phase 2 - Setup
- Build the `requirement.txt` for python development.
- Setup any other configuration file as needed.

## Phase 3a - Open URL and extract HTML 
- Do not implement testing. Only write or modify code in this phase.
- Open the URL Connecticut Judicial site using the url provided in requirement.md.

## Phase 3b - Build Test and Run Test
- Build the test for Phase 3a.  Do not build another test except for phase 3a.
- Run the test in a virtual environment us uv.  Do not run any other test.  

## Phase 4a - Search by Town 
- Search by town on the search page.
- Use the id tag "ctl00_ContentPlaceHolder1_txtCityTown" to input the town name.
- Use the Id tax "ctl00_ContentPlaceHolder1_btnSubmit" to submit the form after inputting town name.
- Return a list of court cases that include name of case, docket number, address and defendant's name.

## Phase 4b - Test Search by Town 
- Test phase 4a by search with 'Middletonw' as an example.
