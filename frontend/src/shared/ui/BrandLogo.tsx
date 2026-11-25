interface BrandLogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  iconOnly?: boolean;
}

export function BrandLogo({ variant = 'dark', size = 'md', iconOnly = false }: BrandLogoProps) {
  const textColor = variant === 'dark' ? 'text-slate-900' : 'text-white';
  const accentColor = variant === 'dark' ? 'text-brand-600' : 'text-blue-200';

  const dimensions = {
    sm: { box: 'w-7 h-7 rounded-lg', text: 'text-base' },
    md: { box: 'w-9 h-9 rounded-xl', text: 'text-lg' },
    lg: { box: 'w-11 h-11 rounded-xl', text: 'text-xl' },
  }[size];

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`${dimensions.box} bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center shadow-sm ring-1 ring-brand-600/20 shrink-0`}
      >
        <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5">
          <rect x="4" y="4" width="8.5" height="8.5" rx="2.2" fill="#FFFFFF" />
          <rect x="4" y="15.5" width="8.5" height="8.5" rx="2.2" fill="#FFFFFF" fillOpacity="0.85" />
          <rect x="15.5" y="15.5" width="8.5" height="8.5" rx="2.2" fill="#FFFFFF" />
          <rect
            x="19.75"
            y="3.2"
            width="7.2"
            height="7.2"
            rx="1.8"
            transform="rotate(45 19.75 3.2)"
            fill="#34D399"
          />
        </svg>
      </div>

      {!iconOnly && (
        <span className={`font-bold tracking-tight ${dimensions.text} ${textColor}`}>
          Business<span className={accentColor}>OS</span>
        </span>
      )}
    </div>
  );
}
