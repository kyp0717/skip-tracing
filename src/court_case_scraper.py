from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from .case import Case

class CaseScraper:
    def __init__(self, driver):
        self.driver = driver

    def search_by_town(self, town):
        return SearchBuilder(self.driver, town)

class SearchBuilder:
    def __init__(self, driver, town):
        self.driver = driver
        self.town = town

    def extract_cases(self):
        # Navigate to the search page
        site = "https://civilinquiry.jud.ct.gov/PropertyAddressSearch.aspx"
        self.driver.get(site)

        # Enter city name
        self.driver.find_element(By.ID, "ctl00_ContentPlaceHolder1_txtCityTown").send_keys(self.town)

        # Click search button
        self.driver.find_element(By.ID, "ctl00_ContentPlaceHolder1_btnSubmit").click()

        # Wait for the table to appear
        table_id = "ctl00_ContentPlaceHolder1_gvPropertyResults"
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, table_id))
        )

        # Get updated page HTML
        html = self.driver.page_source

        # Extract cases from the search results
        cases = []
        soup = BeautifulSoup(html, "html.parser")
        table = soup.find("table", {"id": table_id})
        if table:
            cases = self._extract_cases_from_html(str(table))

        # Enhance each case with detailed information
        site_case = "https://civilinquiry.jud.ct.gov/CaseDetail/PublicCaseDetail.aspx?DocketNo="

        for case in cases:
            docket_cleaned = case.docket.replace("-", "")
            case_url = f"{site_case}{docket_cleaned}"

            self.driver.get(case_url)
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "ctl00_tblContent"))
            )

            case_html = self.driver.page_source
            soup = BeautifulSoup(case_html, "html.parser")

            case.defendant = self._get_defendant(soup)
            case.property_address = self._get_property_address(soup)

        return cases

    def _extract_cases_from_html(self, html):
        cases = []
        soup = BeautifulSoup(html, "html.parser")
        rows = soup.find_all("tr")

        for row in rows:
            cols = row.find_all("td")
            if len(cols) >= 5:
                name = cols[3].text.strip()
                docket_link = cols[4].find("a")
                if docket_link:
                    docket = docket_link.text.strip()
                    cases.append(Case(name, docket))
        return cases

    def _get_defendant(self, soup):
        defendant_element = soup.find("span", {"id": "ctl00_ContentPlaceHolder1_CaseDetailParties1_gvParties_ctl05_lblPtyPartyName"})
        if defendant_element:
            return defendant_element.text.strip()
        return ""

    def _get_property_address(self, soup):
        address_element = soup.find("span", {"id": "ctl00_ContentPlaceHolder1_CaseDetailBasicInfo1_lblPropertyAddress"})
        if address_element:
            return address_element.text.strip()
        return ""
