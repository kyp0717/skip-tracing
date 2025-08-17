import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    BATCHDATA_API_KEY = os.getenv('BATCHDATA_API_KEY')
    USE_SANDBOX = os.getenv('USE_SANDBOX', 'true').lower() == 'true'
    
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