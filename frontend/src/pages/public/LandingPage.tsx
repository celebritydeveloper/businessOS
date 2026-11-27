import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, WifiOff } from 'lucide-react';
import { BentoFeatureCards, HeroDashboardPreview, LandingFaqSection } from './LandingFeatureMockups';
import { LandingPricingSection } from './LandingPricingSection';
import { ProductScreenshotShowcase } from './ProductScreenshotShowcase';
import { LandingIndustriesSection } from './LandingIndustriesSection';


export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white font-extrabold flex items-center justify-center text-sm">B</div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">BusinessOS</span>
          </div>

          <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#industries" className="hover:text-slate-900">Industries</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link to="/login" className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100">
              Sign In
            </Link>
            <Link to="/register" className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-600 text-white hover:bg-brand-700">
              1-Day Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section + UI Screenshot Mockup */}
      <section className="pt-14 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <WifiOff className="w-3.5 h-3.5" /> Offline-First • Built for How Nigerian Businesses Operate
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            The All-in-One Software to Run Your Sales, Stock &amp; Accounting.
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Sell faster, stop counter theft, track customer credit, and see real-time Profit &amp; Loss—even when network drops.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 flex items-center gap-2 shadow-sm"
            >
              Start 1-Day Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#pricing"
              className="px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm hover:bg-slate-50"
            >
              View Naira Pricing
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1-Day Free Trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Works on Phone, Tablet &amp; PC</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 80mm Receipt &amp; White-Label Ready</span>
          </div>
        </div>

        <HeroDashboardPreview />
      </section>

      {/* Bento Feature Grid + Backed SME Data Callout */}
      <section id="features" className="py-16 px-4 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">One Powerful Tool</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Simplify Your Daily Operations</h2>
          </div>

          <BentoFeatureCards />

          {/* Backed Nigerian SME Data Banner */}
          <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Why Digital Records Matter</p>
              <h3 className="text-xl sm:text-2xl font-extrabold leading-snug">
                Over 90% of Nigerian SMEs still rely on paper notebooks—losing up to ₦1 in every ₦4 earned to untracked stock losses and pricing errors.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Industry studies on Nigerian informal and retail commerce show SMEs lose roughly 20%–23% of annual revenue to shrinkage, expired inventory, and uncollected customer debts. BusinessOS closes that gap from day one.
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-3 text-center">
              <p className="text-3xl font-extrabold text-emerald-400">23%</p>
              <p className="text-xs text-slate-300">Average annual revenue lost by manual retail shops to stock leakage &amp; errors</p>
              <Link to="/register" className="block w-full py-2.5 rounded-lg bg-brand-600 text-white text-xs font-bold hover:bg-brand-700">
                Protect Your Margins Free →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ProductScreenshotShowcase />

      {/* All 7 Industries */}
      <LandingIndustriesSection />

      <LandingPricingSection />

      <LandingFaqSection />

      {/* Closing CTA Banner */}
      <section className="py-14 px-4 bg-brand-600 text-white text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Running Your Business Shouldn&apos;t Be Guesswork.</h2>
          <p className="text-xs sm:text-sm text-blue-100">
            Open your store in 60 seconds and test every feature free for 24 hours.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-brand-700 font-extrabold text-sm hover:bg-blue-50 shadow-sm"
          >
            Start Your 1-Day Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-900 text-slate-400 text-center text-xs">
        <p>© {new Date().getFullYear()} BusinessOS. Built for growing Nigerian businesses.</p>
      </footer>
    </div>
  );
}
