#!/usr/bin/env python3
"""
DeepSeek-OCR Command Line Interface

A CLI tool for extracting text from images using DeepSeek-OCR.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

from deepseek_ocr_client import DeepSeekOCRClient


def load_config() -> dict:
    """Load configuration from .env or config file."""
    config_file = Path(__file__).parent.parent / '.env'
    config = {}

    if config_file.exists():
        with open(config_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()

    return config


def main():
    parser = argparse.ArgumentParser(
        description='Extract text from images using DeepSeek-OCR',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract text from a single image
  python ocr_cli.py document.png

  # Extract text with custom endpoint
  python ocr_cli.py --endpoint http://52.54.253.30:8000 document.png

  # Extract text from multiple images
  python ocr_cli.py image1.png image2.jpg image3.png

  # Save output to file
  python ocr_cli.py document.png --output result.txt

  # Extract structured data
  python ocr_cli.py receipt.png --structured --prompt "Extract as JSON: merchant, date, total, items"

  # Batch processing with JSON output
  python ocr_cli.py *.png --batch --json
        """
    )

    parser.add_argument(
        'images',
        nargs='+',
        type=Path,
        help='Path(s) to image file(s)'
    )

    parser.add_argument(
        '--endpoint',
        '-e',
        type=str,
        help='DeepSeek-OCR API endpoint URL (default: from .env or http://localhost:8000)'
    )

    parser.add_argument(
        '--prompt',
        '-p',
        type=str,
        default='Extract all text from this image.',
        help='Custom prompt for text extraction'
    )

    parser.add_argument(
        '--structured',
        '-s',
        action='store_true',
        help='Extract structured data (attempts JSON parsing)'
    )

    parser.add_argument(
        '--batch',
        '-b',
        action='store_true',
        help='Batch mode (process multiple images and show summary)'
    )

    parser.add_argument(
        '--json',
        '-j',
        action='store_true',
        help='Output results as JSON'
    )

    parser.add_argument(
        '--output',
        '-o',
        type=Path,
        help='Output file path (default: stdout)'
    )

    parser.add_argument(
        '--verbose',
        '-v',
        action='store_true',
        help='Verbose output (show API responses)'
    )

    parser.add_argument(
        '--check',
        action='store_true',
        help='Check API health and exit'
    )

    args = parser.parse_args()

    # Load configuration
    config = load_config()
    endpoint = args.endpoint or config.get('DEEPSEEK_OCR_ENDPOINT', 'http://localhost:8000')

    # Initialize client
    client = DeepSeekOCRClient(endpoint)

    # Health check
    if args.check:
        if client.health_check():
            print(f"✓ API is healthy at {endpoint}")
            models = client.get_models()
            print(f"✓ Available models: {[m['id'] for m in models['data']]}")
            return 0
        else:
            print(f"✗ API is not responding at {endpoint}", file=sys.stderr)
            return 1

    # Verify images exist
    for image_path in args.images:
        if not image_path.exists():
            print(f"Error: Image not found: {image_path}", file=sys.stderr)
            return 1

    # Process images
    try:
        if len(args.images) == 1 and not args.batch:
            # Single image mode
            image_path = args.images[0]

            if not args.verbose:
                print(f"Processing {image_path}...", file=sys.stderr)

            if args.structured:
                result = client.extract_structured(image_path, args.prompt)
            else:
                result = client.extract_text_simple(image_path, args.prompt)

            # Format output
            if args.json:
                output = json.dumps({"image": str(image_path), "result": result}, indent=2)
            else:
                output = result if isinstance(result, str) else json.dumps(result, indent=2)

            # Write output
            if args.output:
                args.output.write_text(output)
                print(f"✓ Output saved to {args.output}", file=sys.stderr)
            else:
                print(output)

        else:
            # Batch mode
            if not args.verbose:
                print(f"Processing {len(args.images)} images...", file=sys.stderr)

            results = client.batch_extract(args.images, args.prompt)

            # Format output
            if args.json:
                output = json.dumps(results, indent=2)
            else:
                output = ""
                for result in results:
                    status = "✓" if result['success'] else "✗"
                    output += f"\n{status} {result['image_path']}\n"
                    if result['success']:
                        output += f"{result['text']}\n"
                    else:
                        output += f"Error: {result['error']}\n"
                    output += "-" * 80 + "\n"

            # Write output
            if args.output:
                args.output.write_text(output)
                print(f"✓ Output saved to {args.output}", file=sys.stderr)
            else:
                print(output)

            # Show summary
            if not args.json:
                successful = sum(1 for r in results if r['success'])
                print(f"\n✓ Processed {successful}/{len(results)} images successfully", file=sys.stderr)

        return 0

    except KeyboardInterrupt:
        print("\n\nInterrupted by user", file=sys.stderr)
        return 130
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
