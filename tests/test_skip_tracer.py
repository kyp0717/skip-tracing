import unittest
from unittest.mock import MagicMock, patch
from src.skip_tracer import SkipTracer
import pandas as pd

class TestSkipTracer(unittest.TestCase):

    @patch('src.api_client.BatchDataAPI')
    def test_process_batch(self, mock_api):
        # Mock the BatchDataAPI and its methods
        mock_api_instance = MagicMock()
        mock_api.return_value = mock_api_instance

        # Mock the API response
        mock_api_response = {
            "results": {
                "persons": [
                    {
                        "name": {"first": "John", "last": "Doe"},
                        "propertyAddress": {"street": "123 Main St", "city": "Middletown", "state": "CT", "zip": "06457"},
                        "emails": [{"email": "test@test.com"}],
                        "phoneNumbers": [{"number": "123-456-7890", "reachable": True, "score": 0.9}]
                    }
                ]
            }
        }

        # Configure the mock API to return the mock response
        mock_api_instance.skip_trace_single.return_value = mock_api_response
        mock_api_instance._make_request.return_value = mock_api_response

        # Create a SkipTracer and run process_batch
        tracer = SkipTracer(api_key="dummy_key")
        addresses = [
            {"street": "123 Main St", "city": "Middletown", "state": "CT", "zip": "06457"}
        ]
        results = tracer.process_batch(addresses)

        # Assert that the results are correct
        self.assertEqual(len(results), 1)
        self.assertEqual(results.iloc[0]['name.first'], "John")
        self.assertEqual(results.iloc[0]['name.last'], "Doe")
        self.assertEqual(results.iloc[0]['email'], "test@test.com")
        self.assertEqual(results.iloc[0]['phone1'], "123-456-7890")

if __name__ == '__main__':
    unittest.main()
