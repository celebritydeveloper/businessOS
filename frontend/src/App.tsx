import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './core/auth/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { DashboardHomePage } from './pages/dashboard/DashboardHomePage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { WorkspaceLayout } from './shared/layouts/WorkspaceLayout';
import { ToastProvider } from './shared/ui/ToastProvider';
import { SettingsPage } from './pages/settings/SettingsPage';
import { PlanCheckoutPage } from './pages/billing/PlanCheckoutPage';

function ComingSoonSection({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-500 mt-1">Module queued next in our build roadmap.</p>
    </div>
  );
}

function AppRoutes() {
  const { loading, me } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-7 h-7 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasBusiness = (me?.businesses?.length ?? 0) > 0;

  return (
    <Routes>
      <Route path="/auth/register" element={me ? <Navigate to={hasBusiness ? '/dashboard' : '/onboarding'} replace /> : <RegisterPage />} />
      <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
      <Route path="/auth/login" element={me ? <Navigate to={hasBusiness ? '/dashboard' : '/onboarding'} replace /> : <LoginPage />} />

      <Route
        path="/onboarding"
        element={!me ? <Navigate to="/auth/login" replace /> : hasBusiness ? <Navigate to="/dashboard" replace /> : <OnboardingPage />}
      />

      <Route
        path="/dashboard"
        element={!me ? <Navigate to="/auth/login" replace /> : !hasBusiness ? <Navigate to="/onboarding" replace /> : <WorkspaceLayout />}
      >
        <Route index element={<DashboardHomePage />} />
        <Route path="pos" element={<ComingSoonSection title="POS Terminal" />} />
        <Route path="catalog" element={<ComingSoonSection title="Catalog & Inventory" />} />
        <Route path="sales" element={<ComingSoonSection title="Sales & Receipts" />} />
        <Route path="batches" element={<ComingSoonSection title="Pharmacy Batch & Expiry" />} />
        <Route path="staff" element={<ComingSoonSection title="Staff & PINs" />} />
        <Route path="audit" element={<ComingSoonSection title="Activity Logs" />} />
        <Route path="billing" element={<ComingSoonSection title="Billing & Subscription" />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="/billing" element={me ? <PlanCheckoutPage /> : <Navigate to="/auth/login" replace />} />
        <Route path="/dashboard/*" element={<Navigate to="/billing" replace />} />
      </Route>

      <Route path="*" element={<Navigate to={me ? (hasBusiness ? '/dashboard' : '/onboarding') : '/auth/login'} replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
