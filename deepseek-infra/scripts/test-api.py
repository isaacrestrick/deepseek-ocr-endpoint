#!/usr/bin/env python3
"""
Test script for DeepSeek-OCR API
Sends a simple OCR request to verify the endpoint is working
"""

import os
import sys
import json
import base64
import subprocess
from pathlib import Path

try:
    import requests
except ImportError:
    print("Error: requests library not installed")
    print("Install with: pip3 install requests")
    sys.exit(1)


def get_api_endpoint():
    """Get API endpoint from Terraform output"""
    try:
        script_dir = Path(__file__).parent
        terraform_dir = script_dir.parent / "terraform"

        result = subprocess.run(
            ["terraform", "output", "-raw", "api_endpoint"],
            cwd=terraform_dir,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        print("Error: Could not get API endpoint from Terraform")
        print("Make sure you've run 'terraform apply' first")
        sys.exit(1)


def create_test_image():
    """Load the test image from testimg.png"""
    script_dir = Path(__file__).parent
    test_image_path = script_dir / "testimg.png"
    
    if not test_image_path.exists():
        print(f"Error: Test image not found at {test_image_path}")
        print("Please ensure testimg.png exists in the scripts directory")
        sys.exit(1)
    
    # Read the image and convert to base64
    with open(test_image_path, 'rb') as f:
        img_bytes = f.read()
    
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')
    return f"data:image/png;base64,{img_base64}"


def test_health(endpoint):
    """Test the health endpoint"""
    print(f"Testing health endpoint: {endpoint}/health")
    try:
        response = requests.get(f"{endpoint}/health", timeout=5)
        response.raise_for_status()
        print("✓ Health check passed")
        return True
    except requests.RequestException as e:
        print(f"✗ Health check failed: {e}")
        return False


def test_models(endpoint):
    """Test the models endpoint"""
    print(f"\nTesting models endpoint: {endpoint}/v1/models")
    try:
        response = requests.get(f"{endpoint}/v1/models", timeout=5)
        response.raise_for_status()
        data = response.json()
        models = [m['id'] for m in data.get('data', [])]
        print(f"✓ Available models: {', '.join(models)}")
        return True
    except requests.RequestException as e:
        print(f"✗ Models check failed: {e}")
        return False


def test_ocr(endpoint, image_data):
    """Test OCR inference"""
    print(f"\nTesting OCR inference: {endpoint}/v1/chat/completions")

    payload = {
        "model": "deepseek-ai/DeepSeek-OCR",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all text from this image."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data
                        }
                    }
                ]
            }
        ],
        "max_tokens": 512,
        "temperature": 0.0
    }

    print("Sending OCR request...")
    print(f"Payload size: {len(json.dumps(payload))} bytes")

    try:
        response = requests.post(
            f"{endpoint}/v1/chat/completions",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        response.raise_for_status()

        result = response.json()
        print("✓ OCR request successful")

        # Extract response
        if 'choices' in result and len(result['choices']) > 0:
            content = result['choices'][0]['message']['content']
            print(f"\nExtracted text:\n---\n{content}\n---")

            # Show usage stats
            if 'usage' in result:
                usage = result['usage']
                print(f"\nToken usage:")
                print(f"  Prompt tokens:     {usage.get('prompt_tokens', 'N/A')}")
                print(f"  Completion tokens: {usage.get('completion_tokens', 'N/A')}")
                print(f"  Total tokens:      {usage.get('total_tokens', 'N/A')}")

        return True

    except requests.RequestException as e:
        print(f"✗ OCR request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response body: {e.response.text}")
        return False


def main():
    print("=" * 50)
    print("DeepSeek-OCR API Test")
    print("=" * 50)
    print()

    # Get API endpoint
    endpoint = get_api_endpoint()
    print(f"API Endpoint: {endpoint}")
    print()

    # Run tests
    health_ok = test_health(endpoint)
    if not health_ok:
        print("\n⚠ Health check failed. Is the instance running?")
        print("Start with: ./start-instance.sh")
        sys.exit(1)

    models_ok = test_models(endpoint)

    # Load test image
    print("\nLoading test image (testimg.png)...")
    image_data = create_test_image()
    print("✓ Test image loaded")

    # Test OCR
    ocr_ok = test_ocr(endpoint, image_data)

    # Summary
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    print(f"Health check:   {'✓ Passed' if health_ok else '✗ Failed'}")
    print(f"Models check:   {'✓ Passed' if models_ok else '✗ Failed'}")
    print(f"OCR inference:  {'✓ Passed' if ocr_ok else '✗ Failed'}")
    print()

    if health_ok and models_ok and ocr_ok:
        print("✓ All tests passed! DeepSeek-OCR is working correctly.")
        print("\nYou can now integrate this endpoint into your application.")
        print(f"\nAPI Endpoint: {endpoint}")
        sys.exit(0)
    else:
        print("✗ Some tests failed. Check the logs:")
        print("  ssh ubuntu@<instance-ip> 'docker logs -f deepseek-ocr'")
        sys.exit(1)


if __name__ == "__main__":
    main()
