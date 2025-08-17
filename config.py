import os
import csv
from dotenv import load_dotenv

load_dotenv()

class Config:
    def __init__(self):
        self._load_api_tokens()
        self.USE_SANDBOX = os.getenv('USE_SANDBOX', 'true').lower() == 'true'
        # Set the appropriate API key based on sandbox/production mode
        self.BATCHDATA_API_KEY = self.SANDBOX_API_KEY if self.USE_SANDBOX else self.PRODUCTION_API_KEY
    
    def _load_api_tokens(self):
        """Load API tokens from batchapi.csv file"""
        self.SANDBOX_API_KEY = None
        self.PRODUCTION_API_KEY = None
        
        csv_path = os.path.join(os.path.dirname(__file__), 'batchapi.csv')
        
        if os.path.exists(csv_path):
            with open(csv_path, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['type'] == 'sandbox':
                        self.SANDBOX_API_KEY = row['token']
                    elif row['type'] in ['live', 'production', 'true']:
                        self.PRODUCTION_API_KEY = row['token']
        
        # Fallback to environment variable if CSV not found or tokens not loaded
        if not self.SANDBOX_API_KEY and not self.PRODUCTION_API_KEY:
            env_key = os.getenv('BATCHDATA_API_KEY')
            self.SANDBOX_API_KEY = env_key
            self.PRODUCTION_API_KEY = env_key
    
    SANDBOX_BASE_URL = "https://stoplight.io/mocks/batchdata/batchdata/20349728"
    PRODUCTION_BASE_URL = "https://api.batchdata.com/api/v1"
    
    @property
    def base_url(self):
        return self.SANDBOX_BASE_URL if self.USE_SANDBOX else self.PRODUCTION_BASE_URL
    
    @property
    def skip_trace_endpoint(self):
        return f"{self.base_url}/property/skip-trace"
    
    REQUEST_TIMEOUT = 30
    MAX_RETRIES = 3
    
    MIN_PHONE_SCORE = 90
    
    OUTPUT_COLUMNS = [
        'name.first', 'name.last',
        'propertyAddress.street', 'propertyAddress.city',
        'propertyAddress.county', 'propertyAddress.state',
        'propertyAddress.zip', 'property.equity',
        'property.equityPercent', 'property.absenteeOwner',
        'property.vacant', 'property.uspsDeliverable',
        'phone1', 'phone2', 'phone3', 'email'
    ]

config = Config()