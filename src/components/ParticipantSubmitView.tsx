import React, { useState, useEffect } from 'react';
import {
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Share2,
  Download,
  Users,
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck
} from 'lucide-react';
import { PoolPublicInfo } from '../types';
import { getPublicPoolApi, submitContactApi } from '../utils/api';
import { calculateTimeRemaining, TimeRemaining } from '../utils/time';

interface ParticipantSubmitViewProps {
  poolId: string;
  onGoHome: () => void;
}

export const ParticipantSubmitView: React.FC<ParticipantSubmitViewProps> = ({
  poolId,
  onGoHome,
}) => {
  const [pool, setPool] = useState<PoolPublicInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedContact, setSubmittedContact] = useState<{ name: string; phone: string; count: number } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    formatted: '--:--:--',
  });

  const loadPool = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicPoolApi(poolId);
      setPool(data);
      setTimeRemaining(calculateTimeRemaining(data.expiresAt));
    } catch (err: any) {
      setError(err.message || 'Unable to load contact collection link.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPool();
  }, [poolId]);

  // Timer interval
  useEffect(() => {
    if (!pool) return;
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(pool.expiresAt);
      setTimeRemaining(remaining);
      if (remaining.isExpired && pool.status === 'active') {
        // Refresh pool status
        loadPool();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pool?.expiresAt, pool?.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await submitContactApi(poolId, name.trim(), phone.trim());
      if (res.success) {
        setSubmittedContact({
          name: name.trim() || 'Community Member',
          phone: res.contact?.phone || phone.trim(),
          count: res.count || (pool ? pool.contactCount + 1 : 1),
        });
        if (pool) {
          setPool({
            ...pool,
            contactCount: res.count || pool.contactCount + 1,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! Add your WhatsApp number to "${pool?.title || 'VCF Drop'}" before the timer expires! Join here: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading collection pool...</p>
      </div>
    );
  }

  if (error && !pool) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Collection Link Not Found</h2>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
        </div>
        <button
          type="button"
          onClick={onGoHome}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Futureforce VCF Home</span>
        </button>
      </div>
    );
  }

  const isClosed = pool?.status === 'ended' || timeRemaining.isExpired;

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 animate-in fade-in">
      {/* Top back link */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onGoHome}
          className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Create your own VCF Link</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
          ID: {poolId}
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/80 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        {/* Campaign Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-[11px] text-cyan-400 font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>Community VCF Pool</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {pool?.title}
          </h1>

          {pool?.description && (
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {pool.description}
            </p>
          )}
        </div>

        {/* Live Countdown & Stats Banner */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-3 text-center divide-x divide-slate-800">
            {/* Timer column */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{isClosed ? 'Status' : 'Time Remaining'}</span>
              </span>
              <div className={`text-base sm:text-lg font-black font-mono tracking-tight ${isClosed ? 'text-rose-400' : 'text-cyan-400 animate-pulse'}`}>
                {isClosed ? 'POOL CLOSED' : timeRemaining.formatted}
              </div>
            </div>

            {/* Contacts joined column */}
            <div className="space-y-1 pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" />
                <span>Contacts Joined</span>
              </span>
              <div className="text-base sm:text-lg font-black font-mono text-emerald-400">
                {pool?.contactCount}
              </div>
            </div>
          </div>
        </div>

        {/* State 1: Successfully Submitted */}
        {submittedContact ? (
          <div className="space-y-5 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">You're on the list!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your contact will be compiled into the group VCF as:
              </p>
              <div className="mt-2.5 inline-block bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono text-cyan-400">
                {pool?.prefix} {String(submittedContact.count).padStart(3, '0')} - {submittedContact.name} ({submittedContact.phone})
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-3">
              <p className="leading-relaxed">
                When the timer expires ({isClosed ? 'now' : timeRemaining.formatted}), the organizer will download and share the compiled <code className="text-cyan-400">.vcf</code> file for one-tap WhatsApp contact saving!
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share link with friends</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : isClosed ? (
          /* State 2: Expired Pool */
          <div className="space-y-5 text-center">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="text-amber-400 font-bold text-sm flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>This collection pool has expired.</span>
              </div>
              <p className="text-xs text-slate-400">
                New contact submissions are closed. The list contains {pool?.contactCount} contacts.
              </p>
            </div>

            {pool?.allowPublicDownload ? (
              <div className="space-y-3 p-4 bg-cyan-950/30 border border-cyan-800/40 rounded-2xl">
                <p className="text-xs text-cyan-300 font-medium">
                  The organizer enabled participant download! You can download the compiled contact file directly:
                </p>
                <a
                  href={`/api/pools/${poolId}/export/vcf`}
                  download={`${(pool?.title || 'contacts').replace(/\s+/g, '_')}.vcf`}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm py-3 px-5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Compiled .VCF ({pool?.contactCount} Contacts)</span>
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                The organizer will distribute the compiled VCF file directly through their WhatsApp channel.
              </p>
            )}
          </div>
        ) : (
          /* State 3: Active Pool Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs px-3.5 py-2.5 rounded-xl animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Your Name or Nickname</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe, CyberKnight"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>WhatsApp Phone Number</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Local format or with dial code
                </span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={`e.g. 08012345678 or ${pool?.defaultCountryCode || '+234'}8012345678`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Numbers without dial code will be auto-formatted with {pool?.defaultCountryCode || '+234'}.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-slate-950 font-black text-sm sm:text-base py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-cyan-500/20 active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Adding to list...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Add My Contact to VCF List</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted &amp; private contact drop</span>
          </span>

          <button
            type="button"
            onClick={handleCopyLink}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Share2 className="w-3 h-3" />
            <span>Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
