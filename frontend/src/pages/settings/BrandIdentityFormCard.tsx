import { Input } from '../../shared/ui/Input';
import type { BrandIdentityFormCardProps } from './Settings.types';

export function BrandIdentityFormCard({ form, onChangeForm }: BrandIdentityFormCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <h2 className="text-sm font-bold text-slate-900">Brand Identity &amp; Receipt Details</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Display / App Name"
          placeholder="Apex Pharmacy"
          value={form.app_name}
          onChange={(e) => onChangeForm({ ...form, app_name: e.target.value })}
        />
        <Input
          label="Website URL"
          placeholder="https://apexpharmacy.ng"
          value={form.website}
          onChange={(e) => onChangeForm({ ...form, website: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Logo Image URL"
          placeholder="https://.../logo.png"
          value={form.logo_url}
          onChange={(e) => onChangeForm({ ...form, logo_url: e.target.value })}
        />
        <Input
          label="Favicon URL (Custom Domain)"
          placeholder="https://.../favicon.ico"
          value={form.favicon_url}
          onChange={(e) => onChangeForm({ ...form, favicon_url: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Primary Brand Color</label>
          <div className="flex items-center gap-2.5">
            <input
              type="color"
              value={form.primary_color}
              onChange={(e) => onChangeForm({ ...form, primary_color: e.target.value.toUpperCase() })}
              className="h-11 w-14 rounded-lg border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={form.primary_color}
              onChange={(e) => onChangeForm({ ...form, primary_color: e.target.value.toUpperCase() })}
              className="flex-1 h-11 px-3 rounded-lg border border-slate-200 text-sm font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Secondary / Header Color</label>
          <div className="flex items-center gap-2.5">
            <input
              type="color"
              value={form.secondary_color}
              onChange={(e) => onChangeForm({ ...form, secondary_color: e.target.value.toUpperCase() })}
              className="h-11 w-14 rounded-lg border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={form.secondary_color}
              onChange={(e) => onChangeForm({ ...form, secondary_color: e.target.value.toUpperCase() })}
              className="flex-1 h-11 px-3 rounded-lg border border-slate-200 text-sm font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Support Email"
          type="email"
          placeholder="support@apexpharmacy.ng"
          value={form.support_email}
          onChange={(e) => onChangeForm({ ...form, support_email: e.target.value })}
        />
        <Input
          label="Support Phone"
          type="tel"
          placeholder="08012345678"
          value={form.support_phone}
          onChange={(e) => onChangeForm({ ...form, support_phone: e.target.value })}
        />
      </div>
    </div>
  );
}
