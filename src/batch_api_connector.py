import requests
import csv

class BatchAPIConnector:
    def __init__(self, env='sandbox'):
        self.env = env
        self.api_token = self._get_api_token(env)
        self.base_url = self._get_base_url(env)

    def _get_api_token(self, env):
        with open('batchapi.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                if row[0] == env:
                    return row[1]
        return None

    def _get_base_url(self, env):
        if env == 'sandbox':
            return 'https://stoplight.io/mocks/batchdata/batchdata/20349728/property/skip-trace'
        elif env == 'prod':
            return 'https://api.batchdata.com/api/v1/property/skip-trace'
        return None

    def send_skip_trace_request(self, address):
        """
        Sends a skip trace request to the BatchData API.
        """
        headers = {
            'Authorization': f'Bearer {self.api_token}',
            'Content-Type': 'application/json'
        }
        payload = {
            'propertyAddress': address
        }
        response = requests.post(self.base_url, json=payload, headers=headers)
        if response.status_code == 200:
            results = response.json().get('results', {})
            persons = results.get('persons', [])
            phone_numbers = []
            for person in persons:
                for phone in person.get('phoneNumbers', []):
                    phone_numbers.append(phone.get('number'))
            return phone_numbers
        return []