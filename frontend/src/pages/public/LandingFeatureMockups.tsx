import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function HeroDashboardPreview() {
  return (
    <div className="max-w-4xl mx-auto mt-10 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden text-left">
      <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-[11px] font-mono text-slate-400">app.businessos.ng/dashboard</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
          ● Offline Sync Ready
        </span>
      </div>

      <div className="p-5 sm:p-6 bg-slate-50/70 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <p className="text-[11px] text-slate-500">Today&apos;s Revenue</p>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">₦485,200</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">+18% vs yesterday</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <p className="text-[11px] text-slate-500">Net Profit (Live)</p>
              <p className="text-base sm:text-lg font-extrabold text-emerald-700 mt-0.5">₦142,850</p>
              <p className="text-[10px] text-slate-400 mt-0.5">COGS auto-deducted</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <p className="text-[11px] text-slate-500">Customer Credit</p>
              <p className="text-base sm:text-lg font-extrabold text-amber-700 mt-0.5">₦64,000</p>
              <p className="text-[10px] text-slate-400 mt-0.5">4 active debtors</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Recent POS &amp; Branch Activity</span>
              <span className="text-[11px] text-brand-600 font-semibold">Cashier: Blessing O. (PIN Verified)</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex justify-between">
                <span>Receipt #BOS-1042 • Split (Cash ₦10k + Transfer ₦15.5k)</span>
                <span className="font-mono font-bold text-slate-900">₦25,500</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Batch Alert • Amoxicillin 500mg (14 packs expire in 21 days)</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">Action Needed</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Client Project • Brand Identity &amp; Web UI (Stage: Client Review)</span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">2/3 Revisions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">Quick POS Checkout</p>
            <div className="flex justify-between text-xs"><span>2x Peak Milk Tin (400g)</span><span className="font-mono">₦7,600</span></div>
            <div className="flex justify-between text-xs"><span>1x Golden Penny Semovita 5kg</span><span className="font-mono">₦6,800</span></div>
            <div className="flex justify-between text-xs"><span>1x Paracetamol Syrup 100ml</span><span className="font-mono">₦1,400</span></div>
          </div>
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-sm font-extrabold text-slate-900">
              <span>Total</span>
              <span>₦15,800</span>
            </div>
            <div className="w-full py-2 rounded-lg bg-brand-600 text-white text-center text-xs font-bold">
              Complete Split Sale →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BentoFeatureCards() {
  const cards = [
    {
      title: 'Work smarter, save more time',
      desc: 'Ring up walk-in sales in seconds with Cash + Transfer + POS split payments and instant 80mm thermal receipts.',
      badge: 'POS & Split Checkout',
      previewLines: ['Cash: ₦12,000  |  Transfer: ₦8,500', 'Change Due: ₦0.00 • Stock Auto-Deducted'],
    },
    {
      title: 'One system for all your branches',
      desc: 'Control pricing, dispatch stock transfers, and monitor cashier shifts across every shop location from one phone.',
      badge: 'Multi-Branch Control',
      previewLines: ['Head Office → Biogbolo Branch: 24 Cartons', 'Status: Received & Verified by Branch Manager'],
    },
    {
      title: 'Make smarter business decisions',
      desc: 'Every sale and expense automatically updates your Profit & Loss, Trial Balance, and Customer Credit Book.',
      badge: 'Automated Bookkeeping',
      previewLines: ['Gross Margin: 31.4%  |  Net Profit: ₦1.24M', 'Receivables Collected This Week: ₦310,000'],
    },
    {
      title: 'Keep your business data & cash safe',
      desc: '4-digit Cashier PIN locks, role permissions, and cloud backup prevent unauthorized price edits or stock tampering.',
      badge: 'Anti-Theft Audit Trail',
      previewLines: ['Cashier PIN Switch logged at 14:05 WAT', 'Cloud Sync: All 18 offline sales backed up'],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {cards.map((c) => (
        <div key={c.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold">
              {c.badge}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">{c.title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{c.desc}</p>
          </div>
          <div className="rounded-xl bg-slate-900 text-slate-200 p-3.5 font-mono text-[11px] space-y-1.5 border border-slate-800">
            <p className="text-emerald-400">✓ {c.previewLines[0]}</p>
            <p className="text-slate-400">→ {c.previewLines[1]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const FAQS = [
  {
    q: 'Why should I switch from exercise books and manual receipts to BusinessOS?',
    a: 'Manual notebooks cannot alert you before drugs expire, calculate true net profit after expenses, or stop a cashier from under-ringing items. BusinessOS connects your POS, stock, credit book, and accounting automatically.',
  },
  {
    q: 'What happens when MTN, Airtel, or Glo network drops in my shop?',
    a: 'BusinessOS is offline-first. Your cashiers keep ringing up sales and printing receipts with zero interruption, and everything syncs to the cloud the moment data returns.',
  },
  {
    q: 'How does the 1-Day Free Trial work?',
    a: 'Sign up in under 60 seconds with no card required, set up your store and products, and test live POS sales, reports, and staff PINs for 24 hours before choosing a monthly Naira plan.',
  },
  {
    q: 'Can I manage multiple shops or different business types on one account?',
    a: 'Yes. Growth and Enterprise plans let you run multiple businesses (for example, a Pharmacy and a Poultry Farm or Creative Studio) and multiple branches under one login.',
  },
];

export function LandingFaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 px-4 bg-slate-50 border-t border-slate-200/70">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Frequently Asked Questions</p>
          <h2 className="text-2xl font-extrabold text-slate-900">Everything You Need to Know Before Starting</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={item.q} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-slate-900 cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
