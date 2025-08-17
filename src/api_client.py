import requests
import time
from typing import Dict, List, Optional, Any
from config import config

class BatchDataAPI:
    def __init__(self, api_key: Optional[str] = None):
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
        return self.skip_trace([{
            'street': street,
            'city': city,
            'state': state,
            'zip': zip_code
        }])