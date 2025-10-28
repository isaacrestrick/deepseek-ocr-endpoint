'use client';

import { OCRResponse } from '@/lib/types';

interface ResultDisplayProps {
  result: OCRResponse | null;
  isProcessing: boolean;
}

export default function ResultDisplay({ result, isProcessing }: ResultDisplayProps) {
  if (isProcessing) {
    return (
      <div className="matrix-border rounded-lg p-6 bg-matrix-dark-green/20">
        <div className="text-matrix-green glow font-mono text-center">
          <div className="text-lg mb-3">[PROCESSING...]</div>
          <div className="flex justify-center space-x-2">
            <span className="animate-pulse">▮</span>
            <span className="animate-pulse delay-100">▮</span>
            <span className="animate-pulse delay-200">▮</span>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="matrix-border border-dashed rounded-lg p-6 bg-matrix-dark-green/10 text-center">
        <div className="text-matrix-green/50 font-mono text-sm">
          {'>'} Results will appear here...
        </div>
      </div>
    );
  }

  if (!result.success && result.error) {
    return (
      <div className="border-2 border-red-500 rounded-lg p-4 bg-red-500/10">
        <div className="text-red-500 font-mono">
          <div className="text-base mb-2 font-bold">[ERROR]</div>
          <div className="text-sm">{result.error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-matrix-green glow font-mono text-sm">
          [OUTPUT_RECEIVED]
        </div>
        {result.processingTime && (
          <div className="text-matrix-green/70 font-mono text-sm">
            {result.processingTime}ms
          </div>
        )}
      </div>
      
      <div className="matrix-border rounded-lg p-4 bg-matrix-dark-green/20">
        <div className="text-matrix-green font-mono text-sm whitespace-pre-wrap wrap-break-word">
          {result.result}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigator.clipboard.writeText(result.result || '')}
          className="
            px-4 py-2 
            bg-matrix-dark-green border-2 border-matrix-green 
            text-matrix-green font-mono text-sm
            rounded hover:bg-matrix-green hover:text-black
            transition-all glow
          "
        >
          [COPY_TO_CLIPBOARD]
        </button>
      </div>
    </div>
  );
}

