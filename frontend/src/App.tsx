import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './core/auth/AuthContext';
import { AcceptInvitePage } from './pages/auth/AcceptInvitePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { AccountingPage } from './pages/accounting/AccountingPage';
import { FarmCyclesPage } from './pages/agriculture/FarmCyclesPage';
import { BillingCallbackPage } from './pages/billing/BillingCallbackPage';
import { BillingManagementPage } from './pages/billing/BillingManagementPage';
import { PlanCheckoutPage } from './pages/billing/PlanCheckoutPage';
import { BatchExpiryPage } from './pages/catalog/BatchExpiryPage';
import { CatalogPage } from './pages/catalog/CatalogPage';
import { StockTransfersPage } from './pages/catalog/StockTransfersPage';
import { DashboardHomePage } from './pages/dashboard/DashboardHomePage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { PosTerminalPage } from './pages/pos/PosTerminalPage';
import { SalesHistoryPage } from './pages/pos/SalesHistoryPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ActivityLogsPage } from './pages/staff/ActivityLogsPage';
import { StaffManagementPage } from './pages/staff/StaffManagementPage';
import { WorkspaceLayout } from './shared/layouts/WorkspaceLayout';
import { ToastProvider } from './shared/ui/ToastProvider';
import { CustomersPage } from './pages/contacts/CustomersPage';
import { SuppliersPage } from './pages/contacts/SuppliersPage';

function OnboardingRouteGuard() {
  const { me } = useAuth();
  const [searchParams] = useSearchParams();

  if (!me) return <Navigate to="/auth/login" replace />;

  const hasBusiness = (me.businesses?.length ?? 0) > 0;
  const isNewMode = searchParams.get('mode') === 'new' && Boolean(me.user.is_owner);

  if (hasBusiness && !isNewMode) {
    return <Navigate to="/dashboard" replace />;
  }

  return <OnboardingPage />;
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
      <Route path="/auth/accept-invite" element={<AcceptInvitePage />} />

      <Route path="/onboarding" element={<OnboardingRouteGuard />} />

      <Route path="/billing" element={me ? <PlanCheckoutPage /> : <Navigate to="/auth/login" replace />} />
      <Route path="/billing/callback" element={<BillingCallbackPage />} />

      <Route
        path="/dashboard"
        element={!me ? <Navigate to="/auth/login" replace /> : !hasBusiness ? <Navigate to="/onboarding" replace /> : <WorkspaceLayout />}
      >
        <Route index element={<DashboardHomePage />} />
        <Route path="pos" element={<PosTerminalPage />} />
        <Route path="sales" element={<SalesHistoryPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="batches" element={<BatchExpiryPage />} />
        <Route path="transfers" element={<StockTransfersPage />} />
        <Route path="staff" element={<StaffManagementPage />} />
        <Route path="audit" element={<ActivityLogsPage />} />
        <Route path="accounting" element={<AccountingPage />} />
        <Route path="farm-cycles" element={<FarmCyclesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="billing" element={<BillingManagementPage />} />
        <Route path="settings" element={<SettingsPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
