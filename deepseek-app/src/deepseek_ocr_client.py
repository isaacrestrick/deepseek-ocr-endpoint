"""
DeepSeek-OCR Client Library

A Python client for interacting with the DeepSeek-OCR API endpoint.
"""

import base64
import json
from pathlib import Path
from typing import Optional, Union, Dict, Any
import requests


class DeepSeekOCRClient:
    """Client for DeepSeek-OCR API."""

    def __init__(self, api_endpoint: str, timeout: int = 30):
        """
        Initialize the DeepSeek-OCR client.

        Args:
            api_endpoint: Base URL of the DeepSeek-OCR API (e.g., http://52.54.253.30:8000)
            timeout: Request timeout in seconds (default: 30)
        """
        self.api_endpoint = api_endpoint.rstrip('/')
        self.timeout = timeout

    def _encode_image(self, image_path: Union[str, Path]) -> str:
        """
        Encode an image file to base64.

        Args:
            image_path: Path to the image file

        Returns:
            Base64-encoded image string with data URI prefix
        """
        image_path = Path(image_path)

        if not image_path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")

        with open(image_path, "rb") as f:
            image_data = f.read()

        # Detect image format
        suffix = image_path.suffix.lower()
        mime_type = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.bmp': 'image/bmp'
        }.get(suffix, 'image/jpeg')

        encoded = base64.b64encode(image_data).decode('utf-8')
        return f"data:{mime_type};base64,{encoded}"

    def health_check(self) -> bool:
        """
        Check if the API is healthy.

        Returns:
            True if API is healthy, False otherwise
        """
        try:
            response = requests.get(
                f"{self.api_endpoint}/health",
                timeout=self.timeout
            )
            return response.status_code == 200
        except requests.RequestException:
            return False

    def get_models(self) -> Dict[str, Any]:
        """
        Get available models from the API.

        Returns:
            Dictionary containing model information
        """
        response = requests.get(
            f"{self.api_endpoint}/v1/models",
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()

    def extract_text(
        self,
        image_path: Union[str, Path],
        prompt: str = "Extract all text from this image.",
        max_tokens: int = 512,
        temperature: float = 0.0,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Extract text from an image using OCR.

        Args:
            image_path: Path to the image file
            prompt: Instruction prompt for the model
            max_tokens: Maximum number of tokens to generate
            temperature: Sampling temperature (0.0 for deterministic)
            stream: Whether to stream the response

        Returns:
            Dictionary containing the API response with extracted text
        """
        image_data = self._encode_image(image_path)

        payload = {
            "model": "deepseek-ai/DeepSeek-OCR",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
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
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": stream
        }

        response = requests.post(
            f"{self.api_endpoint}/v1/chat/completions",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()

    def extract_text_simple(
        self,
        image_path: Union[str, Path],
        prompt: str = "Extract all text from this image."
    ) -> str:
        """
        Extract text from an image and return just the text content.

        Args:
            image_path: Path to the image file
            prompt: Instruction prompt for the model

        Returns:
            Extracted text as a string
        """
        result = self.extract_text(image_path, prompt)

        if 'choices' in result and len(result['choices']) > 0:
            return result['choices'][0]['message']['content']

        raise ValueError("Unexpected API response format")

    def extract_structured(
        self,
        image_path: Union[str, Path],
        structure_prompt: str = "Extract text and structure it as JSON with fields: title, body, metadata."
    ) -> Dict[str, Any]:
        """
        Extract text and structure it according to a prompt.

        Args:
            image_path: Path to the image file
            structure_prompt: Prompt describing the desired structure

        Returns:
            Dictionary containing structured data
        """
        result = self.extract_text(image_path, prompt=structure_prompt, max_tokens=1024)

        if 'choices' in result and len(result['choices']) > 0:
            content = result['choices'][0]['message']['content']
            # Try to parse as JSON if it looks like JSON
            if content.strip().startswith('{'):
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    pass
            return {"text": content}

        raise ValueError("Unexpected API response format")

    def batch_extract(
        self,
        image_paths: list[Union[str, Path]],
        prompt: str = "Extract all text from this image."
    ) -> list[Dict[str, Any]]:
        """
        Extract text from multiple images.

        Args:
            image_paths: List of paths to image files
            prompt: Instruction prompt for the model

        Returns:
            List of dictionaries containing results for each image
        """
        results = []
        for image_path in image_paths:
            try:
                result = {
                    "image_path": str(image_path),
                    "success": True,
                    "text": self.extract_text_simple(image_path, prompt),
                    "error": None
                }
            except Exception as e:
                result = {
                    "image_path": str(image_path),
                    "success": False,
                    "text": None,
                    "error": str(e)
                }
            results.append(result)

        return results
