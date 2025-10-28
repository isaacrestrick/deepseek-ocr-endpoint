'use client';

import { useState } from 'react';
import Link from 'next/link';
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
    <div className="min-h-screen bg-black py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <header className="text-center space-y-3 py-3">
          <h1 className="text-3xl md:text-4xl font-mono text-matrix-green glow">
            {'>'} DEEPSEEK_OCR_TERMINAL
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="matrix-border px-4 py-2 rounded">
              <span className="text-matrix-cyan font-mono text-sm">
                STATUS: <span className="cursor-blink">ONLINE</span>
              </span>
            </div>
            <Link
              href="/"
              className="
                inline-flex items-center gap-2
                px-4 py-2
                bg-matrix-dark-green border-2 border-matrix-green
                text-matrix-green font-mono text-sm
                rounded
                hover:bg-matrix-green hover:text-black
                transition-all
              "
            >
              {'<'} [BACK_TO_HOME]
            </Link>
          </div>
        </header>

        {/* Main Form */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="matrix-border rounded-lg p-5 bg-matrix-dark-green/10">
              <h2 className="text-xl font-mono text-matrix-green glow mb-4">
                {'['} INPUT_PARAMETERS {']'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <PromptInput
                  label="SYSTEM_PROMPT"
                  value={systemPrompt}
                  onChange={setSystemPrompt}
                  placeholder="Optional: Configure system behavior..."
                  rows={2}
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
                  rows={4}
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
                      flex-1 px-5 py-2.5
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
                      px-5 py-2.5
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
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <div className="matrix-border rounded-lg p-5 bg-matrix-dark-green/10">
              <h2 className="text-xl font-mono text-matrix-green glow mb-4">
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
        <footer className="text-center text-matrix-green/50 font-mono text-sm py-3 border-t border-matrix-green/20">
          <p>DeepSeek OCR Terminal v1.0.0 | Press [EXECUTE_OCR] to process</p>
        </footer>
      </div>
    </div>
  );
}

