import { Link } from 'react-router-dom';
import { Package, Pill, Receipt, ShoppingCart, TrendingUp } from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';
import { Button } from '../../shared/ui/Button';
import { QuickActionCard } from '../../shared/ui/QuickActionCard';
import { StatCard } from '../../shared/ui/StatCard';

export function DashboardHomePage() {
  const { me, activeBusiness, activeBranch } = useAuth();
  const isPharmacy = activeBusiness?.industry_type === 'pharmacy';

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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value="₦0.00"
          subtitle="Ready for your first sale"
          icon={TrendingUp}
          iconColorClass="text-emerald-600"
        />
        <StatCard
          label="Completed Sales"
          value={0}
          subtitle="Branch receipts issued today"
          icon={Receipt}
        />
        <StatCard
          label="Catalog Items"
          value={0}
          subtitle={`Active SKUs in ${activeBranch?.name || 'branch'}`}
          icon={Package}
        />
        <StatCard
          label={isPharmacy ? 'Expiring Batches (30d)' : 'Low Stock Alerts'}
          value={0}
          subtitle={isPharmacy ? 'FEFO expiry monitor active' : 'Reorder threshold monitor active'}
          icon={Pill}
          iconColorClass="text-amber-500"
        />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickActionCard
          to="/dashboard/settings"
          title="1. Set Up Your Business Branding"
          description="Customize your logo, receipt colors, support contact, and custom domain."
        />
        <QuickActionCard
          to="/dashboard/catalog"
          title={`1. Stock Your ${isPharmacy ? 'Pharmacy Inventory & Batches' : 'Product Catalog'}`}
          description="Add items, barcodes, prices, and initial branch stock levels."
        />
        <QuickActionCard
          to="/dashboard/pos"
          title="2. Start Selling Offline or Online"
          description="Scan barcodes, accept split Cash/POS/Transfer payments, and print receipts."
        />
      </div>
    </div>
  );
}
