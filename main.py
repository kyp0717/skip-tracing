#!/usr/bin/env python3

import argparse
import sys
import os
from typing import Optional
from src.skip_tracer import SkipTracer
from src.utils import (
    read_input_csv, 
    save_results_to_csv, 
    save_results_to_excel,
    print_summary,
    validate_address
)

def main():
    parser = argparse.ArgumentParser(
        description='BatchData Skip Tracing Tool - Find property owner contact information'
    )
    
    parser.add_argument('--mode', choices=['single', 'batch'], default='single',
                       help='Processing mode: single address or batch from CSV')
    
    parser.add_argument('--street', type=str, help='Street address (single mode)')
    parser.add_argument('--city', type=str, help='City (single mode)')
    parser.add_argument('--state', type=str, help='State abbreviation (single mode)')
    parser.add_argument('--zip', type=str, help='ZIP code (single mode)')
    
    parser.add_argument('--input', type=str, help='Input CSV file path (batch mode)')
    parser.add_argument('--output', type=str, default='skip_trace_results.csv',
                       help='Output file path (default: skip_trace_results.csv)')
    
    parser.add_argument('--format', choices=['csv', 'excel'], default='csv',
                       help='Output format (default: csv)')
    
    parser.add_argument('--api-key', type=str, help='BatchData API key (overrides .env)')
    
    args = parser.parse_args()
    
    try:
        tracer = SkipTracer(api_key=args.api_key)
        
        if args.mode == 'single':
            if not all([args.street, args.city, args.state, args.zip]):
                print("Error: Single mode requires --street, --city, --state, and --zip")
                parser.print_help()
                sys.exit(1)
            
            address = {
                'street': args.street,
                'city': args.city,
                'state': args.state.upper(),
                'zip': args.zip
            }
            
            if not validate_address(address):
                print("Error: Invalid address format")
                sys.exit(1)
            
            print(f"\nProcessing: {args.street}, {args.city}, {args.state} {args.zip}")
            
            result = tracer.process_single_property(
                street=args.street,
                city=args.city,
                state=args.state.upper(),
                zip_code=args.zip
            )
            
            if 'error' in result:
                print(f"Error: {result['error']}")
                sys.exit(1)
            
            print("\n" + "="*50)
            print("SKIP TRACE RESULTS")
            print("="*50)
            
            for key, value in result.items():
                if value and not key.startswith('property.'):
                    print(f"{key}: {value}")
            
            print("\nProperty Details:")
            for key, value in result.items():
                if key.startswith('property.') and value:
                    print(f"  {key.replace('property.', '')}: {value}")
            
            import pandas as pd
            df = pd.DataFrame([result])
            
            if args.format == 'excel':
                output_file = args.output.replace('.csv', '.xlsx')
                save_results_to_excel(df, output_file)
            else:
                save_results_to_csv(df, args.output)
        
        else:
            if not args.input:
                print("Error: Batch mode requires --input CSV file")
                parser.print_help()
                sys.exit(1)
            
            print(f"\nReading addresses from: {args.input}")
            addresses = read_input_csv(args.input)
            
            if not addresses:
                print("Error: No valid addresses found in input file")
                sys.exit(1)
            
            print(f"Found {len(addresses)} addresses to process")
            print("-" * 50)
            
            results_df = tracer.process_batch(
                addresses=addresses
            )
            
            if results_df.empty:
                print("\nNo results obtained from skip trace")
                sys.exit(1)
            
            if args.format == 'excel':
                output_file = args.output.replace('.csv', '.xlsx')
                save_results_to_excel(results_df, output_file)
            else:
                save_results_to_csv(results_df, args.output)
            
            print_summary(results_df)
    
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()