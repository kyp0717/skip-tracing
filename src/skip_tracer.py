import pandas as pd
from typing import List, Dict, Optional, Tuple
from src.api_client import BatchDataAPI
from config import config

class SkipTracer:
    def __init__(self, api_key: Optional[str] = None):
        self.api = BatchDataAPI(api_key)
    
    def process_single_property(self, street: str, city: str, state: str, 
                               zip_code: str) -> Dict:
        skip_trace_result = self.api.skip_trace_single(street, city, state, zip_code)
        
        if not skip_trace_result.get('results', {}).get('persons'):
            return {'error': 'No results found for this property'}
        
        person_data = skip_trace_result['results']['persons'][0]
        
        processed_result = self._extract_person_info(person_data)
        
        return self._format_output(processed_result)
    
    def process_batch(self, addresses: List[Dict[str, str]]) -> pd.DataFrame:
        results = []
        
        for i, address in enumerate(addresses):
            print(f"Processing {i+1}/{len(addresses)}: {address['street']}, {address['city']}")
            
            try:
                result = self.process_single_property(
                    street=address['street'],
                    city=address['city'],
                    state=address['state'],
                    zip_code=address['zip']
                )
                
                if 'error' not in result:
                    results.append(result)
                else:
                    print(f"  Warning: {result['error']}")
            
            except Exception as e:
                print(f"  Error processing address: {str(e)}")
                continue
        
        if not results:
            return pd.DataFrame()
        
        df = pd.DataFrame(results)
        
        all_columns = []
        for col in config.OUTPUT_COLUMNS:
            if col in df.columns:
                all_columns.append(col)
        
        return df[all_columns] if all_columns else df
    
    def _extract_person_info(self, person_data: Dict) -> Dict:
        info = {
            'name.first': person_data.get('name', {}).get('first', ''),
            'name.last': person_data.get('name', {}).get('last', ''),
            'propertyAddress.street': person_data.get('propertyAddress', {}).get('street', ''),
            'propertyAddress.city': person_data.get('propertyAddress', {}).get('city', ''),
            'propertyAddress.county': person_data.get('propertyAddress', {}).get('county', ''),
            'propertyAddress.state': person_data.get('propertyAddress', {}).get('state', ''),
            'propertyAddress.zip': person_data.get('propertyAddress', {}).get('zip', ''),
            'property.equity': person_data.get('property', {}).get('equity', ''),
            'property.equityPercent': person_data.get('property', {}).get('equityPercent', ''),
            'property.absenteeOwner': person_data.get('property', {}).get('absenteeOwner', False),
            'property.vacant': person_data.get('property', {}).get('vacant', False),
            'property.uspsDeliverable': person_data.get('property', {}).get('uspsDeliverable', False),
        }
        
        emails = person_data.get('emails', [])
        if emails and isinstance(emails[0], dict):
            info['email'] = emails[0].get('email', '')
        elif emails:
            info['email'] = emails[0] if isinstance(emails[0], str) else ''
        else:
            info['email'] = ''
        
        phone_numbers = person_data.get('phoneNumbers', [])
        valid_phones = []
        
        for phone in phone_numbers:
            if (phone.get('reachable', False) and 
                phone.get('score', 0) >= config.MIN_PHONE_SCORE):
                valid_phones.append({
                    'number': phone.get('number', ''),
                    'type': phone.get('type', ''),
                    'score': phone.get('score', 0)
                })
        
        valid_phones.sort(key=lambda x: x['score'], reverse=True)
        
        info['valid_phones'] = valid_phones
        
        return info
    
    def _format_output(self, processed_data: Dict) -> Dict:
        output = processed_data.copy()
        
        valid_phones = output.pop('valid_phones', [])
        
        for i, phone in enumerate(valid_phones[:3], 1):
            output[f'phone{i}'] = phone['number']
        
        for i in range(len(valid_phones) + 1, 4):
            output[f'phone{i}'] = ''
        
        return output