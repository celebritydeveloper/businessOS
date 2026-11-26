import { useRef } from 'react';

interface PinFourBoxInputProps {
  digits: [string, string, string, string];
  disabled?: boolean;
  onChange: (next: [string, string, string, string]) => void;
  onComplete: (pin: string) => void;
}

export function PinFourBoxInput({ digits, disabled, onChange, onComplete }: PinFourBoxInputProps) {
  const refs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];

  const handleDigitChange = (idx: number, raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(-1);
    const next: [string, string, string, string] = [...digits] as [string, string, string, string];
    next[idx] = clean;
    onChange(next);

    if (clean && idx < 3) refs[idx + 1]?.current?.focus();
    if (clean && idx === 3 && next.every((d) => d.length === 1)) {
      onComplete(next.join(''));
    }
  };

  const handleKeyDown = (idx: number, key: string) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1]?.current?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-3.5">
      {digits.map((val, idx) => (
        <input
          key={idx}
          ref={refs[idx]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          autoFocus={idx === 0}
          disabled={disabled}
          value={val}
          onChange={(e) => handleDigitChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e.key)}
          className="w-14 h-16 sm:w-16 sm:h-18 text-center text-2xl font-bold rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white placeholder-white/40 focus:bg-white/25 focus:border-white focus:outline-none transition-all shadow-lg"
        />
      ))}
    </div>
  );
}
