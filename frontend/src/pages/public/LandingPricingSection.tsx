import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { apiFetch } from '../../core/api/httpClient';

interface PublicPlan {
  id: string;
  slug: string;
  name: string;
  price_monthly: number | string;
  max_businesses: number;
  max_branches: number;
  max_staff: number;
  custom_branding: number | boolean;
}

const FALLBACK_PLANS: PublicPlan[] = [
  { id: 'starter', slug: 'starter', name: 'Starter Shop', price_monthly: 5000, max_businesses: 1, max_branches: 1, max_staff: 3, custom_branding: false },
  { id: 'growth', slug: 'growth', name: 'Growth Business', price_monthly: 15000, max_businesses: 2, max_branches: 4, max_staff: 12, custom_branding: true },
  { id: 'scale', slug: 'scale', name: 'Enterprise Multi-Branch', price_monthly: 35000, max_businesses: 5, max_branches: 15, max_staff: 50, custom_branding: true },
];

export function LandingPricingSection() {
  const [plans, setPlans] = useState<PublicPlan[]>(FALLBACK_PLANS);

  useEffect(() => {
    apiFetch<{ plans: PublicPlan[] }>('/plans').then((res) => {
      if (res.ok && res.body.data?.plans?.length) {
        setPlans(res.body.data.plans);
      }
    });
  }, []);

  return (
    <section id="pricing" className="py-16 px-4 bg-white border-t border-slate-100">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Simple Naira Pricing</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Start With a 1-Day Free Trial. Upgrade Only When Ready.</h2>
          <p className="text-sm text-slate-500">No credit card required to open your store. Test all features live before subscribing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const featured = idx === 1;
            const price = Number(plan.price_monthly || 0);
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 flex flex-col justify-between space-y-6 border ${
                  featured ? 'border-brand-600 ring-2 ring-brand-600/15 bg-slate-50/50 shadow-md' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                    {featured && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white">Most Popular</span>
                    )}
                  </div>

                  <div>
                    <span className="text-3xl font-extrabold text-slate-900">₦{price.toLocaleString('en-NG')}</span>
                    <span className="text-xs text-slate-500"> / month</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Up to {plan.max_businesses} Business{plan.max_businesses > 1 ? 'es' : ''}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Up to {plan.max_branches} Branch Location{plan.max_branches > 1 ? 's' : ''}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Up to {plan.max_staff} Staff &amp; Cashier PINs</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Offline POS, Split Payments &amp; Credit Book</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Automated Profit &amp; Loss + Balance Sheet</li>
                    {Boolean(Number(plan.custom_branding)) && (
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> White-Label Receipt Logo &amp; Custom Domain</li>
                    )}
                  </ul>
                </div>

                <Link
                  to={`/register?plan=${encodeURIComponent(plan.slug)}`}
                  className={`w-full py-3 rounded-xl text-center text-xs sm:text-sm font-bold transition ${
                    featured
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Start 1-Day Free Trial
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
