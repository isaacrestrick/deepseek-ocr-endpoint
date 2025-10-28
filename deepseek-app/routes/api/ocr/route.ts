import { NextRequest, NextResponse } from 'next/server';
import { OCRRequest, OCRResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: OCRRequest = await request.json();
    
    // Validate request
    if (!body.userPrompt) {
      return NextResponse.json(
        {
          success: false,
          error: 'User prompt is required',
        } as OCRResponse,
        { status: 400 }
      );
    }

    if (!body.images || body.images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one image is required',
        } as OCRResponse,
        { status: 400 }
      );
    }

    // Simulate processing time
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const processingTime = Date.now() - startTime;

    // Mock response - simulating OCR output
    const mockResult = `# OCR Processing Complete

## System Configuration
${body.systemPrompt ? `- System Prompt: "${body.systemPrompt}"` : '- No system prompt provided'}
- User Prompt: "${body.userPrompt}"
- Images Processed: ${body.images.length}

## Extracted Content (Mock)

### Document Analysis

This is a **mock response** from the DeepSeek OCR endpoint. In production, this would contain:

1. Extracted text from your images
2. Structured markdown output
3. Tables, formulas, and special formatting preserved
4. Multi-language support

### Sample Output

\`\`\`
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Mathematical formula: E = mc²
Table data would appear here in markdown format
\`\`\`

### Detected Elements

- **Text Blocks**: ${Math.floor(Math.random() * 10) + 1}
- **Images**: ${body.images.length}
- **Tables**: ${Math.floor(Math.random() * 3)}
- **Formulas**: ${Math.floor(Math.random() * 5)}

---

*Note: This is a placeholder response. Connect your vLLM endpoint to see real results.*`;

    const response: OCRResponse = {
      success: true,
      result: mockResult,
      processingTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('OCR API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error processing your request',
      } as OCRResponse,
      { status: 500 }
    );
  }
}

