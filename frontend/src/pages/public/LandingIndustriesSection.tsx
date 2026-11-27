import { Store } from 'lucide-react';

const INDUSTRIES = [
  {
    title: 'Supermarkets & Provision Stores',
    desc: 'Fast barcode/search POS, Cash + Transfer + Card split payments, customer credit book, and instant cashier PIN switching.',
    image: 'https://plus.unsplash.com/premium_photo-1663047739281-76e20fe75998?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    title: 'Pharmacies & Patent Medicine Stores',
    desc: 'Automatic batch & expiry date alerts before drugs expire, VAT-exempt defaults, and multi-branch stock transfers.',
    image: 'https://plus.unsplash.com/premium_photo-1661397081309-c98ead2f9e66?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    title: 'Retail Shops & Boutiques',
    desc: 'Track fast-moving inventory, supplier balances, daily cashier shifts, and branded 80mm thermal receipts.',
    image: 'https://unsplash.com',
  },
  {
    title: 'Restaurants, Bars & Lounges',
    desc: 'Quick order checkout, split Cash/POS/Transfer settlement, daily kitchen/bar expense tracking, and shift accountability.',
    image: 'https://plus.unsplash.com/premium_photo-1770505464112-96e2ae697545?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    title: 'Poultry, Fish & Crop Farms',
    desc: 'Track feed bags, mortality, and farm expenses per batch—calculating exact cost per crate or harvest automatically.',
    image: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    title: 'Creative Agencies & Studios',
    desc: 'Manage client projects, revision caps, time spent, milestone invoices, monthly retainers, and live client tracking links.',
    image: 'https://images.unsplash.com/photo-1642165870627-cd54c078a11f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
  {
    title: 'Laundry & Dry Cleaning Services',
    desc: 'Itemized service billing, customer drop-off contact records, credit balances, and automated daily revenue reports.',
    image: 'https://plus.unsplash.com/premium_photo-1747047886093-950e65f2082e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
  },
];

export function LandingIndustriesSection() {
  return (
    <section id="industries" className="py-16 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">7 Tailored Industry Workflows</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Built for Every Business You Run</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {INDUSTRIES.map((ind) => (
            <div
              key={ind.title}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
            >
              <div className="h-55 w-full bg-slate-100 overflow-hidden">
                <img
                  src={ind.image}
                  alt={ind.title}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-5 space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-brand-600 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900">{ind.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{ind.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
