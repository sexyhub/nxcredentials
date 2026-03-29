"use client";

import { useRef } from "react";

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

export function PinInput({ value, onChange, length = 6, autoFocus = false }: PinInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    if (!char) return;
    const arr = value.split("");
    arr[index] = char;
    const newVal = arr.join("").slice(0, length);
    onChange(newVal);
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value.length > 0) {
        const newVal = value.slice(0, -1);
        onChange(newVal);
        refs.current[Math.max(0, value.length - 1)]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          autoFocus={autoFocus && i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onClick={() => refs.current[Math.min(value.length, i)]?.focus()}
          className={`w-11 h-12 text-center text-base font-bold rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors
            ${i >= 4 ? "border-dashed border-muted-foreground/30" : "border-input"}
            ${value[i] ? "border-foreground/40 bg-accent/40" : ""}
          `}
        />
      ))}
    </div>
  );
}
