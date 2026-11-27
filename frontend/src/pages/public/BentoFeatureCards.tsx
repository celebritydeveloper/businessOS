const BENTO_CARDS = [
  {
    badge: 'Offline-Ready Counter POS',
    title: 'Ring Up Split Payments Without Network Delays',
    desc: 'Combine Cash, Bank Transfer, and POS Card on a single receipt—and keep selling offline even when mobile data drops.',
    previewLines: ['Cash: ₦12,000  |  Transfer: ₦8,500', 'Receipt Issued • Inventory Auto-Deducted'],
  },
  {
    badge: 'Customer Credit & Supplier Book',
    title: 'Never Forget Who Owes Your Business Money',
    desc: 'Set credit limits for trusted buyers, record partial debt repayments, and track supplier balances in one clean ledger.',
    previewLines: ['Client Balance Owed: ₦45,000 (Limit: ₦100,000)', 'Repayment Logged • Receivables Updated'],
  },
  {
    badge: '4-Digit Cashier PIN & Role Locks',
    title: 'Full Accountability Across Every Shift & Branch',
    desc: 'Switch cashiers in two seconds using personal 4-digit PINs while stamping every receipt, stock transfer, and expense with the exact staff ID.',
    previewLines: ['Active Shift: Blessing O. (PIN Verified)', 'Inter-Branch Dispatch: 24 Cartons Received'],
  },
  {
    badge: 'Custom White-Label Branding',
    title: 'Your Logo, Brand Colors & Custom Domain',
    desc: 'Issue 80mm thermal receipts and live client project tracking links carrying your own business identity.',
    previewLines: ['Thermal Receipt Header: Marvy Pharmacy', 'Client Portal Active • Custom Domain Ready'],
  },
];

export function BentoFeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {BENTO_CARDS.map((c) => (
        <div key={c.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold">
              {c.badge}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">{c.title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{c.desc}</p>
          </div>
          <div className="rounded-xl bg-slate-900 text-slate-200 p-3.5 font-mono text-[11px] space-y-1.5 border border-slate-800">
            <p className="text-emerald-400">✓ {c.previewLines}</p>
            <p className="text-slate-400">→ {c.previewLines}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
