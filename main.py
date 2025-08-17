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
        description='BatchData Skip Tracing Tool - Find property owner contact information (Batch Processing)'
    )
    
    parser.add_argument('--input', type=str, required=True,
                       help='Input CSV file path')
    parser.add_argument('--output', type=str, default='skip_trace_results.csv',
                       help='Output file path (default: skip_trace_results.csv)')
    
    parser.add_argument('--format', choices=['csv', 'excel'], default='csv',
                       help='Output format (default: csv)')
    
    parser.add_argument('--api-key', type=str, help='BatchData API key (overrides .env)')
    
    args = parser.parse_args()
    
    try:
        tracer = SkipTracer(api_key=args.api_key)
        
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