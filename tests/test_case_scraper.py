
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import unittest
from src.case_scraper import CaseScraper


class TestCaseScraper(unittest.TestCase):
    def test_scrape_cases(self):
        """
        Tests that the scrape_cases method can find cases for a given town and that the extracted data is correct.
        """
        print("\n" + "="*60)
        print("Phase 4 - Search by Town Test")
        print("="*60)
        
        town = "Middletown"
        print(f"\n[INPUT] Searching for cases in town: {town}")
        print("-" * 40)
        
        scraper = CaseScraper(town)
        cases = scraper.scrape_cases()
        
        print(f"\n[OUTPUT] Found {len(cases)} cases for {town}")
        print("-" * 40)
        
        self.assertIsNotNone(cases)
        self.assertGreater(len(cases), 0)
        
        # Display first 3 cases as examples
        print("\n[SAMPLE RESULTS] First 3 cases:")
        for i, case in enumerate(cases[:3], 1):
            print(f"\nCase {i}:")
            print(f"  Case Name: {case.get('case_name', 'N/A')}")
            print(f"  Defendant: {case.get('defendant', 'N/A')}")
            print(f"  Address: {case.get('address', 'N/A')}")
            print(f"  Docket #: {case.get('docket_number', 'N/A')}")
            print(f"  Docket URL: {case.get('docket_url', 'N/A')}")
        
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
            
        print("\n[VALIDATION] Testing data structure integrity...")
        for case in cases:
            self.assertIn("case_name", case)
            self.assertIn("docket_number", case)
            self.assertIn("docket_url", case)
            self.assertIn("address", case)
            self.assertIn("defendant", case)
            self.assertTrue(
                case["docket_url"].startswith("https://civilinquiry.jud.ct.gov/")
            )
        print("✓ All cases have required fields")
        print("✓ All docket URLs are properly formatted")
        
        print("\n" + "="*60)
        print("Phase 4 Test: PASSED")
        print("="*60)


if __name__ == "__main__":
    unittest.main()
