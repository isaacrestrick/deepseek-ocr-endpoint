'use client';

interface PromptInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export default function PromptInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
}: PromptInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-matrix-green glow text-sm font-mono">
        {'>'} {label} {required && <span className="text-matrix-cyan">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="
          w-full px-4 py-2.5 
          bg-black border-2 border-matrix-green 
          text-matrix-green font-mono text-sm
          rounded-lg
          focus:outline-none focus:border-matrix-cyan focus:ring-2 focus:ring-matrix-cyan/50
          placeholder-matrix-green/30
          resize-y
          transition-all
          matrix-border
        "
      />
    </div>
  );
}

