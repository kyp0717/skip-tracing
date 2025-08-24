import unittest
from unittest.mock import patch, MagicMock
from src.api_client import BatchDataAPI

class TestBatchDataAPI(unittest.TestCase):

    def setUp(self):
        self.api_key = "test_api_key"
        self.api = BatchDataAPI(api_key=self.api_key)

    def test_init(self):
        self.assertEqual(self.api.api_key, self.api_key)
        self.assertIn("Authorization", self.api.headers)
        self.assertEqual(self.api.headers["Authorization"], f"Bearer {self.api_key}")

    @patch('requests.Session.request')
    def test_make_request_success(self, mock_request):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        mock_request.return_value = mock_response

        response = self.api._make_request("POST", "https://example.com", json_data={})

        self.assertEqual(response, {"success": True})
        mock_request.assert_called_once()

    @patch('requests.Session.request')
    def test_skip_trace_single_success(self, mock_request):
        # Mock the response from the API
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"result": "success"}
        mock_request.return_value = mock_response

        # Call the method to be tested
        result = self.api.skip_trace_single("123 Main St", "Anytown", "CA", "12345")

        # Assert that the request was made with the correct data
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        self.assertEqual(kwargs['json']['requests'][0]['propertyAddress']['street'], "123 Main St")

        # Assert that the result is what we expect
        self.assertEqual(result, {"result": "success"})

if __name__ == '__main__':
    unittest.main()
