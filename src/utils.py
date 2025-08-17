import pandas as pd
import os
from typing import List, Dict, Optional

def read_input_csv(file_path: str) -> List[Dict[str, str]]:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Input file not found: {file_path}")
    
    df = pd.read_csv(file_path)
    
    required_columns = ['street', 'city', 'state', 'zip']
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        raise ValueError(f"Input CSV missing required columns: {missing_columns}")
    
    df['zip'] = df['zip'].astype(str)
    
    addresses = df[required_columns].to_dict('records')
    
    return addresses

def save_results_to_csv(df: pd.DataFrame, output_path: str):
    if df.empty:
        print("No results to save")
        return
    
    df.to_csv(output_path, index=False)
    print(f"Results saved to: {output_path}")

def save_results_to_excel(df: pd.DataFrame, output_path: str):
    if df.empty:
        print("No results to save")
        return
    
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Skip Trace Results', index=False)
        
        worksheet = writer.sheets['Skip Trace Results']
        for idx, col in enumerate(df.columns):
            max_length = max(
                df[col].astype(str).map(len).max(),
                len(str(col))
            ) + 2
            worksheet.column_dimensions[chr(65 + idx)].width = min(max_length, 50)
    
    print(f"Results saved to: {output_path}")

def format_phone_number(phone: str) -> str:
    digits = ''.join(filter(str.isdigit, str(phone)))
    
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11 and digits[0] == '1':
        return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
    else:
        return phone

def validate_address(address: Dict[str, str]) -> bool:
    required_fields = ['street', 'city', 'state', 'zip']
    
    for field in required_fields:
        if field not in address or not address[field]:
            return False
    
    if len(address['state']) != 2:
        return False
    
    zip_digits = ''.join(filter(str.isdigit, str(address['zip'])))
    if len(zip_digits) < 5:
        return False
    
    return True

def print_summary(results_df: pd.DataFrame):
    if results_df.empty:
        print("\nNo results to summarize")
        return
    
    print("\n" + "="*50)
    print("SKIP TRACE SUMMARY")
    print("="*50)
    print(f"Total properties processed: {len(results_df)}")
    
    phone_cols = [col for col in results_df.columns if col.startswith('phone')]
    total_phones = sum(results_df[col].notna().sum() for col in phone_cols)
    print(f"Total phone numbers found: {total_phones}")
    
    if 'email' in results_df.columns:
        emails_found = results_df['email'].notna().sum()
        print(f"Total emails found: {emails_found}")
    
    if 'property.absenteeOwner' in results_df.columns:
        absentee = results_df['property.absenteeOwner'].sum()
        print(f"Absentee owners: {absentee}")
    
    if 'property.vacant' in results_df.columns:
        vacant = results_df['property.vacant'].sum()
        print(f"Vacant properties: {vacant}")
    
    print("="*50)