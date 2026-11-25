import type { ReactNode } from 'react';
import { CheckCircle2, ShieldCheck, Store, WifiOff } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';

interface AuthSplitLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthSplitLayout({ title, subtitle, children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Form Column */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <div>
          <BrandLogo variant="dark" />
        </div>

        <div className="w-full max-w-md mx-auto my-10">
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>

        <footer className="text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} BusinessOS. All rights reserved.
        </footer>
      </div>

      {/* Right Royal Blue Showcase Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-600 text-white p-12 xl:p-16 relative overflow-hidden">
        <div className="max-w-md mt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-5">
            <WifiOff className="w-3.5 h-3.5" /> Offline-First Multi-Industry OS
          </span>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            The simplest way to run your entire business
          </h2>
          <p className="mt-3 text-sm text-blue-100 leading-relaxed">
            Manage sales, batch expiry, multi-branch inventory, and VAT compliance—even when the internet drops.
          </p>
        </div>

        {/* Floating Dashboard Preview Card */}
        <div className="relative my-8 max-w-lg">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Branch</p>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Store className="w-4 h-4 text-brand-600" /> Apex Pharmacy &amp; Mart — Main
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Synced
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500">Today&apos;s Sales</p>
                <p className="text-xl font-bold text-slate-900 mt-1">₦482,500</p>
                <p className="text-[11px] font-semibold text-emerald-600 mt-1">+18.4% vs yesterday</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs text-slate-500">Batch &amp; Stock Health</p>
                <p className="text-xl font-bold text-slate-900 mt-1">99.2%</p>
                <p className="text-[11px] font-semibold text-brand-600 mt-1">2 batches expiring soon</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-medium text-slate-700">Amoxicillin 500mg (Batch #B402)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">₦3,200</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="font-medium text-slate-700">Split Payment (POS + Transfer)</span>
                <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold">Verified</span>
              </div>
            </div>
          </div>

          {/* Floating Compliance Badge */}
          <div className="hidden xl:flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl absolute -bottom-5 -right-5 border border-slate-700">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold">FIRS VAT &amp; Audit Ready</p>
              <p className="text-slate-400">Encrypted &amp; Clash-Free Sync</p>
            </div>
          </div>
        </div>

        {/* Supported Industries Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/15 text-xs font-semibold tracking-wide text-blue-100">
          <span>RETAIL</span>
          <span>PHARMACY</span>
          <span>SUPERMARKET</span>
          <span>LAUNDRY</span>
          <span>RESTAURANT</span>
          <span>FARM</span>
        </div>
      </div>
    </div>
  );
}
