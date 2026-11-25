interface AlertBannerProps {
  type?: 'error' | 'success' | 'info';
  message: string;
}

export function AlertBanner({ type = 'error', message }: AlertBannerProps) {
  if (!message) return null;

  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    info: 'bg-brand-50 border-brand-100 text-brand-900',
  };

  return (
    <div className={`px-3.5 py-2.5 rounded-lg border text-xs font-medium ${styles[type]}`}>
      {message}
    </div>
  );
}
