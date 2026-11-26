import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Package, Pill, Receipt, ShoppingCart, TrendingUp } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import { getIndustryCapabilities } from '../../core/config/industryCapabilities';
import { Button } from '../../shared/ui/Button';
import { QuickActionCard } from '../../shared/ui/QuickActionCard';
import { StatCard } from '../../shared/ui/StatCard';
import type { DashboardOverviewResponse } from './Dashboard.types';
import { DashboardAlertsCard } from './DashboardAlertsCard';
import { SalesTrendChartCard } from './SalesTrendChartCard';

export function DashboardHomePage() {
  const { me, activeBusiness, activeBranch } = useAuth();
  const isOwner = Boolean(me?.user.is_owner);
  const perms = activeBranch?.permissions || [];
  const canViewDashboard = isOwner || perms.includes('*') || perms.includes('dashboard.view');

  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    if (!activeBusiness?.id || !activeBranch?.id || !canViewDashboard) return;
    setLoading(true);
    const res = await apiFetch<DashboardOverviewResponse>(
      `/workspace/businesses/${activeBusiness.id}/branches/${activeBranch.id}/overview`
    );
    if (res.ok && res.body.data) setData(res.body.data);
    setLoading(false);
  }, [activeBusiness?.id, activeBranch?.id, canViewDashboard]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  if (!canViewDashboard) {
    return <Navigate to="/dashboard/pos" replace />;
  }

  const supportsBatchExpiry = getIndustryCapabilities(activeBusiness?.industry_type).supportsBatchExpiry;
  const kpis = data?.kpis;
  const todayRevFormatted = `₦${(kpis?.today_revenue ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Welcome back, {me?.user.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {activeBusiness?.name} &bull; <span className="font-medium text-slate-700">{activeBranch?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/dashboard/catalog">
            <Button variant="secondary">Add Product</Button>
          </Link>
          <Link to="/dashboard/pos">
            <Button>
              <ShoppingCart className="w-4 h-4" /> Open POS Terminal
            </Button>
          </Link>
        </div>
      </div>

      {/* Live KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={loading ? '...' : todayRevFormatted}
          subtitle={`Month-to-date: ₦${(kpis?.month_revenue ?? 0).toLocaleString('en-NG')}`}
          icon={TrendingUp}
          iconColorClass="text-emerald-600"
        />
        <StatCard
          label="Completed Sales"
          value={loading ? '...' : (kpis?.today_orders ?? 0)}
          subtitle="Branch receipts issued today"
          icon={Receipt}
        />
        <StatCard
          label="Catalog Items"
          value={loading ? '...' : (kpis?.catalog_count ?? 0)}
          subtitle={`Active SKUs in ${activeBusiness?.name || 'business'}`}
          icon={Package}
        />
        <StatCard
          label={supportsBatchExpiry ? 'Expiring Batches (60d)' : 'Low Stock Alerts'}
          value={loading ? '...' : (supportsBatchExpiry ? (kpis?.expiring_count ?? 0) : (kpis?.low_stock_count ?? 0))}
          subtitle={supportsBatchExpiry ? `${kpis?.low_stock_count ?? 0} items also low on stock` : 'Reorder threshold monitor active'}
          icon={Pill}
          iconColorClass="text-amber-500"
        />
      </div>

      {/* Live 7-Day Chart & Alerts */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesTrendChartCard trend={data.daily_trend} paymentMix={data.payment_mix} />
          </div>
          <div>
            <DashboardAlertsCard
              kpis={data.kpis}
              supportsBatchExpiry={supportsBatchExpiry}
              recentSales={data.recent_sales}
            />
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          to="/dashboard/settings"
          title="1. Set Up Your Business Branding"
          description="Customize your logo, receipt colors, support contact, and custom domain."
        />
        <QuickActionCard
          to="/dashboard/catalog"
          title={`2. Stock Your ${supportsBatchExpiry ? 'Inventory & Batches' : 'Product Catalog'}`}
          description="Add items, barcodes, prices, and initial branch stock levels."
        />
        <QuickActionCard
          to="/dashboard/pos"
          title="3. Start Selling Offline or Online"
          description="Scan barcodes, accept split Cash/POS/Transfer payments, and print receipts."
        />
      </div>
    </div>
  );
}
