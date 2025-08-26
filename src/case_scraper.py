import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.site_connector import SiteConnector
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup

class CaseScraper:
    def __init__(self, town):
        self.town = town
        self.url = "https://civilinquiry.jud.ct.gov/PropertyAddressSearch.aspx"
        self.connector = SiteConnector(self.url)
        self.driver = None

    def scrape_cases(self):
        """
        Scrape the case information for a given town.
        """
        self.driver = self.connector.connect()
        if not self.driver:
            return []

        try:
            # Find the town input field and enter the town name
            town_input = self.driver.find_element(By.ID, "ctl00_ContentPlaceHolder1_txtCityTown")
            town_input.send_keys(self.town)

            # Find and click the submit button
            submit_button = self.driver.find_element(By.ID, "ctl00_ContentPlaceHolder1_btnSubmit")
            submit_button.click()

            # Wait for the page to load and get the page source
            self.driver.implicitly_wait(10) 
            page_source = self.driver.page_source

            # Parse the page source with BeautifulSoup
            soup = BeautifulSoup(page_source, 'html.parser')

            cases = []
            table = soup.find('table', id='ctl00_ContentPlaceHolder1_gvPropertyResults')
            if not table:
                return []

            for row in table.find_all('tr')[1:]:
                cells = row.find_all('td')
                if len(cells) < 5:
                    continue

                case_name = cells[3].text.strip()
                defendant = case_name.split(' v. ')[-1]

                case = {
                    'case_name': case_name,
                    'docket_number': cells[4].text.strip(),
                    'address': cells[1].text.strip(),
                    'defendant': defendant
                }
                cases.append(case)
            
            return cases

        except Exception as e:
            print(f"An error occurred while scraping: {e}")
            return []
        finally:
            self.connector.close()

if __name__ == '__main__':
    # Example usage
    town = "Middletown"
    scraper = CaseScraper(town)
    cases = scraper.scrape_cases()
    if cases:
        print(f"Found {len(cases)} cases for {town}:")
        for case in cases:
            print(case)
    else:
        print(f"No cases found for {town}.")