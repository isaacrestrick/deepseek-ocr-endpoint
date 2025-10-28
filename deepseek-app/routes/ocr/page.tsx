'use client';

import { useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import PromptInput from '@/components/PromptInput';
import ResultDisplay from '@/components/ResultDisplay';
import { ImageFile, OCRRequest, OCRResponse } from '@/lib/types';

export default function OCRPage() {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [result, setResult] = useState<OCRResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!userPrompt.trim()) {
      setError('User prompt is required');
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setError('');
    setIsProcessing(true);
    setResult(null);

    try {
      // Convert images to base64 (they're already in base64 from FileReader)
      const imageData = images.map(img => img.preview);

      const requestData: OCRRequest = {
        systemPrompt: systemPrompt.trim() || undefined,
        userPrompt: userPrompt.trim(),
        images: imageData,
      };

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: OCRResponse = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || 'Processing failed');
      }
    } catch (err) {
      console.error('Error submitting OCR request:', err);
      setError('Failed to connect to the API');
      setResult({
        success: false,
        error: 'Network error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSystemPrompt('');
    setUserPrompt('');
    setImages([]);
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4 py-8">
          <h1 className="text-4xl md:text-5xl font-mono text-matrix-green glow">
            {'>'} DEEPSEEK_OCR_TERMINAL
          </h1>
          <p className="text-matrix-green/70 font-mono text-sm md:text-base">
            Test your vLLM-compatible endpoint for document processing
          </p>
          <div className="inline-block matrix-border px-4 py-2 rounded">
            <span className="text-matrix-cyan font-mono text-xs">
              STATUS: <span className="cursor-blink">ONLINE</span>
            </span>
          </div>
        </header>

        {/* Main Form */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="matrix-border rounded-lg p-6 bg-matrix-dark-green/10">
              <h2 className="text-xl font-mono text-matrix-green glow mb-6">
                {'['} INPUT_PARAMETERS {']'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <PromptInput
                  label="SYSTEM_PROMPT"
                  value={systemPrompt}
                  onChange={setSystemPrompt}
                  placeholder="Optional: Configure system behavior..."
                  rows={3}
                />

                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                />

                <PromptInput
                  label="USER_PROMPT"
                  value={userPrompt}
                  onChange={setUserPrompt}
                  placeholder="Enter your OCR instructions..."
                  required
                  rows={5}
                />

                {error && (
                  <div className="border-2 border-red-500 rounded-lg p-3 bg-red-500/10">
                    <div className="text-red-500 font-mono text-sm">
                      [ERROR] {error}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="
                      flex-1 px-6 py-3
                      bg-matrix-green text-black font-mono font-bold
                      rounded-lg
                      hover:bg-matrix-cyan
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all
                      shadow-[0_0_10px_rgba(0,255,65,0.5)]
                      hover:shadow-[0_0_20px_rgba(0,255,255,0.7)]
                    "
                  >
                    {isProcessing ? '[PROCESSING...]' : '[EXECUTE_OCR]'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="
                      px-6 py-3
                      bg-matrix-dark-green border-2 border-matrix-green
                      text-matrix-green font-mono
                      rounded-lg
                      hover:bg-matrix-green hover:text-black
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all
                    "
                  >
                    [RESET]
                  </button>
                </div>
              </form>
            </div>

            {/* Info Panel */}
            <div className="matrix-border border-dashed rounded-lg p-4 bg-matrix-dark-green/5">
              <div className="text-matrix-green/70 font-mono text-xs space-y-2">
                <div>{'>'} TIPS:</div>
                <div>• Upload multiple images for batch processing</div>
                <div>• System prompt configures OCR behavior</div>
                <div>• User prompt specifies extraction requirements</div>
                <div>• Mock endpoint returns placeholder data</div>
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="matrix-border rounded-lg p-6 bg-matrix-dark-green/10 min-h-[600px]">
              <h2 className="text-xl font-mono text-matrix-green glow mb-6">
                {'['} OUTPUT_RESULTS {']'}
              </h2>
              
              <ResultDisplay
                result={result}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-matrix-green/50 font-mono text-xs py-8 border-t border-matrix-green/20">
          <p>DeepSeek OCR Terminal v1.0.0 | vLLM Compatible Endpoint Testing Interface</p>
          <p className="mt-2">Press [EXECUTE_OCR] to process • Press [RESET] to clear</p>
        </footer>
      </div>
    </div>
  );
}

