import { AccountingMockup, AgricultureMockup, ExpiryMockup } from './ShowcaseScreenCards';

const SHOWCASE_ITEMS = [
  {
    tag: 'Double-Entry Accounting & P&L',
    title: 'Know Your Exact Net Operating Profit Every Single Day',
    desc: 'BusinessOS pairs every sale with its Cost of Goods Sold (COGS) and operating expenses to generate instant Profit & Loss, Trial Balance, and General Ledger reports.',
    bullets: ['Live Gross Margin % and Net Profit cards', 'One-click Trial Balance CSV export', 'Branch-by-branch or consolidated company view'],
    mockup: <AccountingMockup />,
  },
  {
    tag: 'Batch & FEFO Expiry Protection',
    title: 'Catch Expiring Stock 60 Days Early Before It Eats Your Capital',
    desc: 'Track manufacturer batch numbers, dispense oldest stock first (FEFO), and automatically block expired packs at the checkout counter.',
    bullets: ['30-day and 60-day early expiry warning counters', 'Automatic First-Expired, First-Out deduction', 'Zero accidental sale of expired medications'],
    mockup: <ExpiryMockup />,
  },
  {
    tag: 'Agribusiness & Production Cycles',
    title: 'Calculate True Cost Per Bird, Crate, or Harvest Automatically',
    desc: 'Manage poultry pens, fish ponds, and crop plots from stocking day to harvest—calculating exact unit production cost before setting wholesale prices.',
    bullets: ['Live survival stock & mortality rate tracking', 'Automatic cost-per-bird or cost-per-hectare calculation', 'Direct harvest transfer into your POS storefront'],
    mockup: <AgricultureMockup />,
  },
];

export function ProductScreenshotShowcase() {
  return (
    <section id="screens" className="py-16 px-4 sm:px-6 bg-slate-50 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Inside BusinessOS</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Built With Deep Tools for Real Operational Control</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            See how your accounting, expiry monitor, and production modules work together out of the box.
          </p>
        </div>

        <div className="space-y-10">
          {SHOWCASE_ITEMS.map((item, idx) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className={`lg:col-span-4 space-y-3 ${idx % 2 === 1 ? 'lg:order-2' : ''}`}>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                  {item.tag}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                <ul className="space-y-1.5 pt-1 text-xs text-slate-700 font-medium">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`lg:col-span-8 ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>{item.mockup}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
