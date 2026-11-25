import { useAuth } from '../core/auth/AuthContext';
import { BrandLogo } from '../shared/ui/BrandLogo';
import { Button } from '../shared/ui/Button';

export function WorkspacePlaceholder() {
  const { me, activeBusiness, activeBranch, logout } = useAuth();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between">
        <BrandLogo />
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 text-brand-700">
            Status: {me?.subscription?.status || 'trialing'}
          </span>
          <Button variant="secondary" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 mt-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h1 className="text-xl font-bold text-slate-900">
            Welcome, {me?.user.full_name}
          </h1>
          <p className="text-sm text-slate-600">
            Active Business: <strong>{activeBusiness?.name}</strong> ({activeBusiness?.industry_type})
          </p>
          <p className="text-sm text-slate-600">
            Active Branch: <strong>{activeBranch?.name}</strong>
          </p>
          <p className="text-sm text-slate-600">
            VAT Compliance:{' '}
            <strong>
              {activeBusiness?.is_vat_registered
                ? `VAT Registered (${activeBusiness.default_vat_rate}%)`
                : 'Exempt / Not VAT Registered (0%)'}
            </strong>
          </p>
        </div>
      </main>
    </div>
  );
}
