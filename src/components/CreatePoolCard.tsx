import React, { useState } from 'react';
import {
  Link2,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { createPoolApi } from '../utils/api';
import { SavedLocalCampaign } from '../types';

interface CreatePoolCardProps {
  onPoolCreated: (poolId: string, adminKey: string) => void;
}

const DURATION_PRESETS = [
  { label: '1 Hour', minutes: 60 },
  { label: '3 Hours', minutes: 180 },
  { label: '6 Hours', minutes: 360 },
  { label: '12 Hours', minutes: 720 },
  { label: '24 Hours', minutes: 1440, recommended: true },
  { label: '48 Hours', minutes: 2880 },
];

export const CreatePoolCard: React.FC<CreatePoolCardProps> = ({ onPoolCreated }) => {
  const [title, setTitle] = useState<string>('Futureforce WhatsApp Connect');
  const [prefix, setPrefix] = useState<string>('Futureforce');
  const [description, setDescription] = useState<string>('Drop your WhatsApp number to be saved into our mutual contacts VCF file!');
  const [durationMinutes, setDurationMinutes] = useState<number>(1440);
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [customHours, setCustomHours] = useState<number>(24);
  const [defaultCountryCode, setDefaultCountryCode] = useState<string>('+234');
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [allowPublicDownload, setAllowPublicDownload] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const finalDuration = isCustomDuration ? customHours * 60 : durationMinutes;

      const res = await createPoolApi({
        title: title.trim(),
        prefix: prefix.trim() || 'Contact',
        description: description.trim(),
        durationMinutes: Math.max(5, finalDuration),
        defaultCountryCode,
        removeDuplicates,
        allowPublicDownload,
      });

      // Save to localStorage
      const savedList: SavedLocalCampaign[] = JSON.parse(
        localStorage.getItem('futureforce_saved_pools') || '[]'
      );

      const newEntry: SavedLocalCampaign = {
        id: res.pool.id,
        adminKey: res.adminKey,
        title: res.pool.title,
        prefix: res.pool.prefix,
        createdAt: res.pool.createdAt,
        expiresAt: res.pool.expiresAt,
      };

      const updatedList = [newEntry, ...savedList.filter(item => item.id !== res.pool.id)].slice(0, 15);
      localStorage.setItem('futureforce_saved_pools', JSON.stringify(updatedList));

      onPoolCreated(res.pool.id, res.adminKey);
    } catch (err: any) {
      setError(err.message || 'Failed to generate link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>No Sign-Up Required</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Create a Timed VCF Collection Link
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate a shareable link, send it to people on WhatsApp, and download the compiled .vcf file when your timer expires.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs px-3.5 py-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-4">
        {/* Title and Prefix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Event / Group Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Futureforce WhatsApp Connect"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Contact Save Prefix
            </label>
            <input
              type="text"
              required
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. Futureforce"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Description note */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Public Message for Participants (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Drop your number to be added to our mutual status booster!"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>

        {/* Expiration Timer Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Link Expiration Duration</span>
            </span>
            <span className="text-[11px] text-slate-500">
              When timer ends, link closes and contacts compile
            </span>
          </label>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {DURATION_PRESETS.map((preset) => {
              const isSelected = !isCustomDuration && durationMinutes === preset.minutes;
              return (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => {
                    setDurationMinutes(preset.minutes);
                    setIsCustomDuration(false);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Duration Input */}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustomDuration(!isCustomDuration)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-lg border cursor-pointer transition-all ${
                isCustomDuration
                  ? 'bg-cyan-950 text-cyan-400 border-cyan-700'
                  : 'text-slate-500 hover:text-slate-300 border-slate-800'
              }`}
            >
              {isCustomDuration ? 'Custom Hours Selected' : '+ Set Custom Hours'}
            </button>

            {isCustomDuration && (
              <div className="flex items-center gap-1.5 animate-in fade-in">
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={customHours}
                  onChange={(e) => setCustomHours(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center font-mono"
                />
                <span className="text-xs text-slate-400">hours</span>
              </div>
            )}
          </div>
        </div>

        {/* Country Code & Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Default Country Dial Code
            </label>
            <select
              value={defaultCountryCode}
              onChange={(e) => setDefaultCountryCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="+234">Nigeria (+234)</option>
              <option value="+1">United States / Canada (+1)</option>
              <option value="+44">United Kingdom (+44)</option>
              <option value="+233">Ghana (+233)</option>
              <option value="+254">Kenya (+254)</option>
              <option value="+27">South Africa (+27)</option>
              <option value="+91">India (+91)</option>
              <option value="+971">UAE (+971)</option>
              <option value="+49">Germany (+49)</option>
              <option value="+33">France (+33)</option>
            </select>
          </div>

          <div className="space-y-2 pt-2 sm:pt-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={removeDuplicates}
                onChange={(e) => setRemoveDuplicates(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 w-4 h-4"
              />
              <span>Prevent duplicate phone numbers</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={allowPublicDownload}
                onChange={(e) => setAllowPublicDownload(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 w-4 h-4"
              />
              <span>Allow participants to download VCF when timer ends</span>
            </label>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-slate-950 font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-cyan-500/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Generating Link...</span>
            ) : (
              <>
                <Link2 className="w-4 h-4 text-slate-950" />
                <span>Generate VCF Collection Link</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Private admin panel created instantly. No login or password required.</span>
        </div>
      </form>
    </div>
  );
};
