import { NextRequest, NextResponse } from 'next/server';
import { OCRRequest, OCRResponse } from '@/lib/types';

// DeepSeek OCR API endpoint - deployed on AWS EC2
const DEEPSEEK_API_ENDPOINT = process.env.DEEPSEEK_API_ENDPOINT || 'http://52.54.253.30:8000';
const DEEPSEEK_MODEL = 'deepseek-ai/DeepSeek-OCR';

interface VLLMMessage {
  role: string;
  content: Array<{
    type: string;
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

interface VLLMRequest {
  model: string;
  messages: VLLMMessage[];
  max_tokens: number;
  temperature: number;
}

interface VLLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

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

    const startTime = Date.now();

    // Build the vLLM request in OpenAI-compatible format
    const messageContent: VLLMMessage['content'] = [];
    
    // Add system prompt as text if provided
    if (body.systemPrompt) {
      messageContent.push({
        type: 'text',
        text: body.systemPrompt,
      });
    }

    // Add user prompt
    messageContent.push({
      type: 'text',
      text: body.userPrompt,
    });

    // Add all images
    for (const imageBase64 of body.images) {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${imageBase64}`,
        },
      });
    }

    const vllmRequest: VLLMRequest = {
      model: DEEPSEEK_MODEL,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      max_tokens: 2048,
      temperature: 0.0,
    };

    // Call the DeepSeek OCR API
    const apiResponse = await fetch(`${DEEPSEEK_API_ENDPOINT}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vllmRequest),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('DeepSeek API Error:', apiResponse.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `DeepSeek API error: ${apiResponse.statusText}. Please ensure the API instance is running.`,
        } as OCRResponse,
        { status: 502 }
      );
    }

    const vllmResponse: VLLMResponse = await apiResponse.json();
    const processingTime = Date.now() - startTime;

    // Extract the OCR result from the response
    const result = vllmResponse.choices[0]?.message?.content || 'No content returned from OCR';

    const response: OCRResponse = {
      success: true,
      result,
      processingTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('OCR API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: `Failed to process OCR request: ${errorMessage}`,
      } as OCRResponse,
      { status: 500 }
    );
  }
}

