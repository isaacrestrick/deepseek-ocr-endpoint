'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [displayText, setDisplayText] = useState('');
  const fullText = '> DEEPSEEK_OCR_TERMINAL_v1.0';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Terminal Header */}
        <div className="matrix-border rounded-lg p-8 bg-matrix-dark-green/10">
          <div className="font-mono space-y-6">
            {/* Animated Title */}
            <h1 className="text-3xl md:text-5xl text-matrix-green glow">
              {displayText}
              <span className="cursor-blink">_</span>
            </h1>

            {/* System Info */}
            <div className="space-y-2 text-sm md:text-base text-matrix-green/80">
              <div>{'>'} Initializing system...</div>
              <div>{'>'} Loading neural networks...</div>
              <div>{'>'} Establishing connection to vLLM endpoint...</div>
              <div className="text-matrix-cyan">{'>'} System ready.</div>
            </div>

            {/* Description */}
            <div className="border-l-2 border-matrix-green pl-4 text-matrix-green/70 text-sm space-y-2">
              <p>
                Welcome to the DeepSeek OCR Terminal Interface.
              </p>
              <p>
                This application allows you to test your vLLM-compatible DeepSeek OCR endpoint
                by uploading images and prompts for document processing.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <div className="text-matrix-green glow text-sm">
                {'['} SYSTEM_CAPABILITIES {']'}
              </div>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-matrix-green/70">
                <li>{'>'} Multi-image upload support</li>
                <li>{'>'} Drag-and-drop interface</li>
                <li>{'>'} Custom system prompts</li>
                <li>{'>'} Real-time processing</li>
                <li>{'>'} Markdown output format</li>
                <li>{'>'} Image preview grid</li>
                <li>{'>'} Retro Matrix UI theme</li>
                <li>{'>'} vLLM endpoint compatible</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="pt-6">
              <Link
                href="/ocr"
                className="
                  inline-block px-8 py-4
                  bg-matrix-green text-black font-bold
                  rounded-lg
                  hover:bg-matrix-cyan
                  transition-all
                  shadow-[0_0_20px_rgba(0,255,65,0.5)]
                  hover:shadow-[0_0_30px_rgba(0,255,255,0.7)]
                  transform hover:scale-105
                "
              >
                {'['} ACCESS_OCR_TERMINAL {']'}
              </Link>
            </div>

            {/* Status Bar */}
            <div className="pt-6 border-t border-matrix-green/20">
              <div className="flex flex-wrap gap-4 text-xs text-matrix-green/60">
                <div>STATUS: <span className="text-matrix-cyan cursor-blink">ONLINE</span></div>
                <div>VERSION: <span className="text-matrix-green">1.0.0</span></div>
                <div>MODE: <span className="text-matrix-green">DEVELOPMENT</span></div>
                <div>ENDPOINT: <span className="text-matrix-green">MOCK</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Panels */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="matrix-border border-dashed rounded-lg p-4 bg-matrix-dark-green/5">
            <div className="text-matrix-green glow text-xs mb-2">{'['} QUICK_START {']'}</div>
            <div className="text-matrix-green/70 text-xs space-y-1">
              <div>1. Access terminal</div>
              <div>2. Upload images</div>
              <div>3. Enter prompts</div>
              <div>4. Execute OCR</div>
            </div>
          </div>

          <div className="matrix-border border-dashed rounded-lg p-4 bg-matrix-dark-green/5">
            <div className="text-matrix-green glow text-xs mb-2">{'['} SUPPORTED_FILES {']'}</div>
            <div className="text-matrix-green/70 text-xs space-y-1">
              <div>• JPEG images</div>
              <div>• PNG images</div>
              <div>• WEBP images</div>
              <div>• Max 10MB/file</div>
            </div>
          </div>

          <div className="matrix-border border-dashed rounded-lg p-4 bg-matrix-dark-green/5">
            <div className="text-matrix-green glow text-xs mb-2">{'['} COMING_SOON {']'}</div>
            <div className="text-matrix-green/70 text-xs space-y-1">
              <div>• User authentication</div>
              <div>• PDF support</div>
              <div>• Example library</div>
              <div>• History tracking</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-matrix-green/40 font-mono text-xs">
          <p>DeepSeek OCR Terminal Interface</p>
          <p className="mt-1">Powered by vLLM | Next.js | Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}
