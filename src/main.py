from selenium import webdriver
from .court_case_scraper import CaseScraper
from .skip_tracer import SkipTracer, save_to_csv

def main():
    # Initialize the webdriver
    driver = webdriver.Chrome() # You may need to change this to the path of your chromedriver

    # Create a CaseScraper
    scraper = CaseScraper(driver)

    # Search for cases in a town
    cases = scraper.search_by_town("Middletown").extract_cases()

    # Close the driver
    driver.quit()

    # Extract addresses from cases
    addresses = []
    for case in cases:
        if case.property_address:
            # The address format is "123 Main St, Middletown, CT 06457"
            parts = case.property_address.split(',')
            if len(parts) >= 3:
                street = parts[0].strip()
                city = parts[1].strip()
                state_zip = parts[2].strip().split(' ')
                if len(state_zip) >= 2:
                    state = state_zip[0]
                    zip_code = state_zip[1]
                    addresses.append({
                        "street": street,
                        "city": city,
                        "state": state,
                        "zip": zip_code
                    })

    # Initialize the SkipTracer
    skip_tracer = SkipTracer()

    # Process the addresses
    results = skip_tracer.process_batch(addresses)

    # Save the results to a csv file
    save_to_csv(results, "outputs/skip_trace_results.csv")

if __name__ == "__main__":
    main()