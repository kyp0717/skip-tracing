import unittest
from src.case import Case, save_cases_to_csv
import os

class TestCase(unittest.TestCase):

    def test_case_creation(self):
        case = Case("Test Name", "Test Docket")
        self.assertEqual(case.name, "Test Name")
        self.assertEqual(case.docket, "Test Docket")
        self.assertEqual(case.defendant, "")
        self.assertEqual(case.property_address, "")
        self.assertEqual(case.phone_numbers, [])

    def test_to_csv_record(self):
        case = Case("Test Name", "Test Docket")
        case.defendant = "Test Defendant"
        case.property_address = "123 Main St"
        case.phone_numbers = ["123-456-7890"]
        self.assertEqual(case.to_csv_record(), ["Test Name", "Test Docket", "Test Defendant", "123 Main St", "123-456-7890"])

    def test_save_cases_to_csv(self):
        cases = [
            Case("Test Name 1", "Test Docket 1"),
            Case("Test Name 2", "Test Docket 2")
        ]
        cases[0].defendant = "Test Defendant 1"
        cases[0].property_address = "123 Main St"
        cases[0].phone_numbers = ["111-111-1111"]
        cases[1].defendant = "Test Defendant 2"
        cases[1].property_address = "456 Oak Ave"
        cases[1].phone_numbers = ["222-222-2222"]

        filename = "test_cases.csv"
        save_cases_to_csv(cases, filename)

        self.assertTrue(os.path.exists(filename))

        with open(filename, "r") as f:
            lines = f.readlines()
            self.assertEqual(len(lines), 3)
            self.assertEqual(lines[0].strip(), "Name,Docket,Defendant,Property Address,Phone Numbers")
            self.assertEqual(lines[1].strip(), "Test Name 1,Test Docket 1,Test Defendant 1,123 Main St,111-111-1111")
            self.assertEqual(lines[2].strip(), "Test Name 2,Test Docket 2,Test Defendant 2,456 Oak Ave,222-222-2222")

        os.remove(filename)

if __name__ == '__main__':
    unittest.main()
