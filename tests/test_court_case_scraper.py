import unittest
from unittest.mock import MagicMock, patch
from src.court_case_scraper import CaseScraper, SearchBuilder
from src.case import Case

class TestCourtCaseScraper(unittest.TestCase):

    @patch('selenium.webdriver.Chrome')
    def test_extract_cases(self, mock_driver):
        # Mock the webdriver and its methods
        mock_driver_instance = MagicMock()
        mock_driver.return_value = mock_driver_instance

        # Mock the HTML content of the search results page
        search_results_html = '''
        <table id="ctl00_ContentPlaceHolder1_gvPropertyResults">
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td>Test Name 1</td>
                <td><a href="#">Test Docket 1</a></td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td>Test Name 2</td>
                <td><a href="#">Test Docket 2</a></td>
            </tr>
        </table>
        '''

        # Mock the HTML content of the case detail page
        case_detail_html = '''
        <span id="ctl00_ContentPlaceHolder1_CaseDetailParties1_gvParties_ctl05_lblPtyPartyName">Test Defendant</span>
        <span id="ctl00_ContentPlaceHolder1_CaseDetailBasicInfo1_lblPropertyAddress">123 Main St, Middletown, CT 06457</span>
        '''

        # Configure the mock driver to return the mock HTML
        mock_driver_instance.page_source = search_results_html
        mock_driver_instance.get.side_effect = [None, None] # To simulate page navigation

        # Create a CaseScraper and run extract_cases
        scraper = CaseScraper(mock_driver_instance)
        
        # We need to mock the second page load for case details
        def get_side_effect(url):
            if "CaseDetail" in url:
                mock_driver_instance.page_source = case_detail_html
        mock_driver_instance.get.side_effect = get_side_effect
        cases = scraper.search_by_town("Middletown").extract_cases()

        # Assert that the cases were extracted correctly
        self.assertEqual(len(cases), 2)
        self.assertEqual(cases[0].name, "Test Name 1")
        self.assertEqual(cases[0].docket, "Test Docket 1")
        self.assertEqual(cases[0].defendant, "Test Defendant")
        self.assertEqual(cases[0].property_address, "123 Main St, Middletown, CT 06457")
        self.assertEqual(cases[1].name, "Test Name 2")
        self.assertEqual(cases[1].docket, "Test Docket 2")
        self.assertEqual(cases[1].defendant, "Test Defendant")
        self.assertEqual(cases[1].property_address, "123 Main St, Middletown, CT 06457")

if __name__ == '__main__':
    unittest.main()