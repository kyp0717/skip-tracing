#!/usr/bin/env python3
"""
Main application for CT Judiciary case scraper with phone lookup
"""

import sys
import json
from src.case_scraper import CaseScraper
from src.batch_api_connector import BatchAPIConnector


def parse_address_to_dict(address_str):
    """Parse address string into structured format for API."""
    parts = address_str.split(',')
    if len(parts) >= 2:
        street = parts[0].strip()
        remainder = parts[1].strip()
        
        # Split city, state, zip
        words = remainder.split()
        if len(words) >= 2:
            zip_code = words[-1]
            state = words[-2]
            city = ' '.join(words[:-2]) if len(words) > 2 else words[0]
            
            return {
                'street': street,
                'city': city,
                'state': state,
                'zip': zip_code
            }
    return None


def main():
    """
    Main function to orchestrate the scraping and phone lookup process
    """
    # Parse command line arguments
    if len(sys.argv) < 2:
        print("Usage: python main.py <town_name> [--skip-trace] [--prod]")
        print("       --skip-trace: Enable batch API phone lookup")
        print("       --prod: Use production API instead of sandbox")
        sys.exit(1)
    
    town_name = sys.argv[1]
    enable_skip_trace = '--skip-trace' in sys.argv
    use_production = '--prod' in sys.argv
    
    print(f"\n{'='*60}")
    print(f"CT Judiciary Case Scraper")
    print(f"{'='*60}")
    print(f"\nSearching for cases in: {town_name}")
    if enable_skip_trace:
        api_mode = "PRODUCTION" if use_production else "SANDBOX"
        print(f"Skip trace (phone lookup) enabled: YES ({api_mode})")
    print(f"{'-'*40}")
    
    try:
        # Phase 4 Integration: Case Scraping
        # Initialize the case scraper
        scraper = CaseScraper(town_name)
        
        # Scrape cases for the specified town
        cases = scraper.scrape_cases()
        
        if not cases:
            print(f"No cases found for {town_name}")
            return
        
        print(f"\nFound {len(cases)} cases")
        
        # Display first 5 cases as examples
        print(f"\n{'-'*40}")
        print("Sample Results (First 5 cases):")
        print(f"{'-'*40}")
        
        for i, case in enumerate(cases[:5], 1):
            print(f"\nCase {i}:")
            print(f"  Case Name: {case['case_name']}")
            print(f"  Defendant: {case['defendant']}")
            print(f"  Address: {case['address']}")
            print(f"  Docket #: {case['docket_number']}")
            print(f"  Docket URL: {case['docket_url']}")
        
        # Phase 5/6 Integration: Batch API Phone Lookup
        if enable_skip_trace:
            phase_num = "6" if use_production else "5"
            api_env = "prod" if use_production else "sandbox"
            api_label = "Production" if use_production else "Sandbox"
            
            print(f"\n{'='*60}")
            print(f"Phase {phase_num}: Batch API Phone Lookup ({api_label})")
            print(f"{'='*60}")
            
            # Initialize the batch API connector
            api_connector = BatchAPIConnector(api_env)
            
            # Process first 2 cases for phone lookup (as per requirements)
            cases_to_process = cases[:2]
            print(f"\nProcessing {len(cases_to_process)} addresses for phone lookup...")
            
            for i, case in enumerate(cases_to_process, 1):
                print(f"\n{'-'*40}")
                print(f"Processing Case {i}:")
                print(f"  Defendant: {case['defendant']}")
                print(f"  Address: {case['address']}")
                
                # Parse address into structured format
                address_dict = parse_address_to_dict(case['address'])
                
                if address_dict:
                    # Send skip trace request
                    phone_numbers = api_connector.send_skip_trace_request(address_dict)
                    
                    # Add phone numbers to case data
                    case['phone_numbers'] = phone_numbers
                    
                    if phone_numbers:
                        print(f"  Phone Numbers Found: {', '.join(phone_numbers)}")
                    else:
                        print("  No phone numbers found")
                else:
                    print("  Could not parse address")
                    case['phone_numbers'] = []
        
        # Save results to both JSON and CSV files
        json_filename = f"cases_{town_name.lower().replace(' ', '_')}.json"
        with open(json_filename, 'w') as f:
            json.dump(cases, f, indent=2)
        
        # Save to CSV using the scraper's save_to_csv method
        csv_filename = scraper.save_to_csv(cases)
        
        print(f"\n{'-'*40}")
        print(f"Results saved to:")
        print(f"  JSON: {json_filename}")
        print(f"  CSV: {csv_filename}")
        print(f"Total cases found: {len(cases)}")
        if enable_skip_trace:
            enriched_count = sum(1 for c in cases if c.get('phone_numbers'))
            print(f"Cases with phone numbers: {enriched_count}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()