#!/usr/bin/env python3

import csv
import re
import os

# Read the cases.csv file (actual filename)
input_file = 'data/inputs/cases.csv'
output_file = 'data/inputs/extracted_addresses.csv'

# Create output directory if needed
os.makedirs('data/inputs', exist_ok=True)
os.makedirs('data/output', exist_ok=True)

addresses = []

print(f"Reading addresses from: {input_file}")

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    
    for row_num, row in enumerate(reader, 2):  # Start at 2 since row 1 is header
        property_address = row.get('Property Address', '').strip()
        
        if not property_address:
            print(f"  Row {row_num}: No address")
            continue
            
        # Skip invalid addresses
        if 'See Clerk' in property_address:
            print(f"  Row {row_num}: Skipping 'See Clerk's Note'")
            continue
            
        # Parse address: "street, city, state zip"
        # Handle various formats
        parts = property_address.split(',')
        
        if len(parts) >= 3:
            street = parts[0].strip()
            # Clean up street - remove leading #
            street = re.sub(r'^#', '', street).strip()
            
            # For complex addresses with extra parts, combine middle parts as city
            if len(parts) > 3:
                # Last part should have state and zip
                state_zip = parts[-1].strip()
                # Everything between street and state_zip is city/extra info
                # But if it contains "Unit" or "Association", it's part of the street
                city = "Middletown"  # Default city for this dataset
            else:
                city = parts[1].strip()
                state_zip = parts[2].strip()
            
            # Parse state and zip from last part
            state_zip_match = re.match(r'([A-Z]{2})\s+(\d{5})', state_zip)
            if state_zip_match:
                state = state_zip_match.group(1)
                zip_code = state_zip_match.group(2)
                
                # Skip addresses with invalid ZIP codes
                if zip_code == "00000":
                    print(f"  Row {row_num}: Skipping invalid ZIP 00000")
                    continue
                
                # Clean up street address - remove unit info if present
                if 'Unit' in street:
                    street = street.split(',')[0].strip()
                
                address = {
                    'street': street,
                    'city': city,
                    'state': state,
                    'zip': zip_code
                }
                addresses.append(address)
                print(f"  Row {row_num}: {street}, {city}, {state} {zip_code}")
            else:
                print(f"  Row {row_num}: Could not parse state/zip from '{state_zip}'")
        else:
            print(f"  Row {row_num}: Invalid format: '{property_address}'")

# Write extracted addresses to CSV
if addresses:
    with open(output_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['street', 'city', 'state', 'zip'])
        writer.writeheader()
        writer.writerows(addresses)
    
    print(f"\nExtracted {len(addresses)} valid addresses")
    print(f"Saved to: {output_file}")
else:
    print("\nNo valid addresses found")