import requests
import time
from typing import Dict, List, Optional, Any
from config import config

class BatchDataAPI:
    """A client for interacting with the BatchData API."""

    def __init__(self, api_key: Optional[str] = None):
        """Initializes the BatchDataAPI client.

        Args:
            api_key: The BatchData API key. If not provided, it will be read from the
                BATCHDATA_API_KEY environment variable.
        """
        self.api_key = api_key or config.BATCHDATA_API_KEY
        if not self.api_key:
            raise ValueError("API key is required. Set BATCHDATA_API_KEY in .env file")
        
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def _make_request(self, method: str, url: str, json_data: Optional[Dict] = None, 
                     retries: int = 0) -> Dict:
        """Makes a request to the BatchData API with retry logic.

        Args:
            method: The HTTP method to use.
            url: The URL to make the request to.
            json_data: The JSON data to send with the request.
            retries: The number of retries that have been attempted.

        Returns:
            The JSON response from the API.
        """
        try:
            response = self.session.request(
                method=method,
                url=url,
                json=json_data,
                timeout=config.REQUEST_TIMEOUT
            )
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            if retries < config.MAX_RETRIES:
                time.sleep(2 ** retries)
                return self._make_request(method, url, json_data, retries + 1)
            raise Exception(f"API request failed after {config.MAX_RETRIES} retries: {str(e)}")
    
    def skip_trace(self, addresses: List[Dict[str, str]]) -> Dict:
        """Performs a skip trace for a list of addresses.

        Args:
            addresses: A list of addresses to skip trace. Each address should be a
                dictionary with 'street', 'city', 'state', and 'zip' keys.

        Returns:
            The JSON response from the API.
        """
        if not addresses:
            raise ValueError("At least one address is required")
        
        requests_data = []
        for addr in addresses:
            if not all(k in addr for k in ['street', 'city', 'state', 'zip']):
                raise ValueError("Each address must have street, city, state, and zip")
            
            requests_data.append({
                'propertyAddress': {
                    'street': addr['street'],
                    'city': addr['city'],
                    'state': addr['state'],
                    'zip': addr['zip']
                }
            })
        
        json_data = {'requests': requests_data}
        
        return self._make_request('POST', config.skip_trace_endpoint, json_data)
    
    def skip_trace_single(self, street: str, city: str, state: str, zip_code: str) -> Dict:
        """Performs a skip trace for a single address.

        Args:
            street: The street address.
            city: The city.
            state: The state.
            zip_code: The zip code.

        Returns:
            The JSON response from the API.
        """
        return self.skip_trace([{
            'street': street,
            'city': city,
            'state': state,
            'zip': zip_code
        }])