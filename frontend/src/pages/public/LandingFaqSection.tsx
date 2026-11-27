import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
