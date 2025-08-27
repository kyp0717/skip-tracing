
import unittest
from src.case_scraper import CaseScraper


class TestCaseScraper(unittest.TestCase):
    def test_scrape_cases(self):
        """
        Tests that the scrape_cases method can find cases for a given town and that the extracted data is correct.
        """
        town = "Middletown"
        scraper = CaseScraper(town)
        cases = scraper.scrape_cases()
        self.assertIsNotNone(cases)
        self.assertGreater(len(cases), 0)
        with open('tests/test_addresses.json', 'w') as f:
            import json
            addresses = []
            for case in cases[:2]:
                # address is in the format: street, city, state zip
                # we need to convert it to a dictionary
                parts = case['address'].split(',')
                street = parts[0].strip()
                city_state_zip = parts[1].strip().split()
                city = city_state_zip[0]
                state = city_state_zip[1]
                zip_code = city_state_zip[2]
                addresses.append({
                    'street': street,
                    'city': city,
                    'state': state,
                    'zip': zip_code
                })
            json.dump(addresses, f)
        for case in cases:
            self.assertIn("case_name", case)
            self.assertIn("docket_number", case)
            self.assertIn("docket_url", case)
            self.assertIn("address", case)
            self.assertIn("defendant", case)
            self.assertTrue(
                case["docket_url"].startswith("https://civilinquiry.jud.ct.gov/")
            )


if __name__ == "__main__":
    unittest.main()
