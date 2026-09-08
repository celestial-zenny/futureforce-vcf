import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Clock,
  Users,
  Copy,
  Check,
  Share2,
  Trash2,
  Plus,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Search,
  Settings2,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  ExternalLink,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { VcfPool } from '../types';
import {
  getAdminPoolApi,
  updateAdminPoolApi,
  deleteContactApi,
  submitContactApi
} from '../utils/api';
import { calculateTimeRemaining, TimeRemaining } from '../utils/time';

interface AdminPanelViewProps {
  adminKey: string;
  onGoHome: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  adminKey,
  onGoHome,
}) => {
  const [pool, setPool] = useState<VcfPool | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & UI states
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Add contact manually state
  const [showManualAdd, setShowManualAdd] = useState<boolean>(false);
  const [manualName, setManualName] = useState<string>('');
  const [manualPhone, setManualPhone] = useState<string>('');

  // Settings edit state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editPrefix, setEditPrefix] = useState<string>('');
  const [editAllowPublicDownload, setEditAllowPublicDownload] = useState<boolean>(true);

  // Live Timer
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    formatted: '--:--:--',
  });

  const loadAdminPool = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);
      const data = await getAdminPoolApi(adminKey);
      setPool(data);
      setEditTitle(data.title);
      setEditPrefix(data.prefix);
      setEditAllowPublicDownload(data.allowPublicDownload);
      setTimeRemaining(calculateTimeRemaining(data.expiresAt));

      // Pre-generate QR code for public link
      const publicUrl = `${window.location.origin}/?pool=${data.id}`;
      QRCode.toDataURL(publicUrl, {
        width: 250,
        margin: 1.5,
        color: { dark: '#020617', light: '#38bdf8' }
      }).then(url => setQrDataUrl(url)).catch(() => {});

    } catch (err: any) {
      setError(err.message || 'Invalid or expired admin panel key.');
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminPool();
  }, [adminKey]);

  // Interval timer tick & periodic roster poll
  useEffect(() => {
    if (!pool) return;
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(pool.expiresAt);
      setTimeRemaining(remaining);
    }, 1000);

    // Auto-refresh contacts every 15 seconds silently
    const pollInterval = setInterval(() => {
      loadAdminPool(true);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
    };
  }, [pool?.expiresAt]);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleExtendTimer = async (minutes: number) => {
    try {
      setRefreshing(true);
      const updated = await updateAdminPoolApi(adminKey, { extendMinutes: minutes });
      setPool(updated);
      setTimeRemaining(calculateTimeRemaining(updated.expiresAt));
      showToast(`Timer extended by ${minutes >= 60 ? `${minutes / 60} hours` : `${minutes} mins`}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to extend timer');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (newStatus: 'active' | 'ended') => {
    try {
      setRefreshing(true);
      const updated = await updateAdminPoolApi(adminKey, { status: newStatus });
      setPool(updated);
      showToast(newStatus === 'ended' ? 'Collection pool ended manually.' : 'Collection pool reopened!');
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setRefreshing(true);
      const updated = await updateAdminPoolApi(adminKey, {
        title: editTitle,
        prefix: editPrefix,
        allowPublicDownload: editAllowPublicDownload,
      });
      setPool(updated);
      setShowSettings(false);
      showToast('Pool settings updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteContact = async (contactId: string, name: string) => {
    if (!confirm(`Remove "${name || 'this contact'}" from the VCF pool?`)) return;
    try {
      await deleteContactApi(adminKey, contactId);
      if (pool) {
        setPool({
          ...pool,
          contacts: pool.contacts.filter(c => c.id !== contactId),
        });
      }
      showToast('Contact removed.');
    } catch (err: any) {
      alert(err.message || 'Failed to remove contact');
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPhone.trim() || !pool) return;
    try {
      setRefreshing(true);
      const res = await submitContactApi(pool.id, manualName.trim(), manualPhone.trim());
      if (res.success && res.contact) {
        setPool({
          ...pool,
          contacts: [...pool.contacts, res.contact],
        });
        setManualName('');
        setManualPhone('');
        setShowManualAdd(false);
        showToast('Contact added to roster!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add contact');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyLink = (type: 'public' | 'admin') => {
    const text = type === 'public'
      ? `${window.location.origin}/?pool=${pool?.id}`
      : window.location.href;
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleShareWhatsApp = () => {
    const publicUrl = `${window.location.origin}/?pool=${pool?.id}`;
    const text = `Hey! Add your WhatsApp contact to "${pool?.title || 'VCF Drop'}" before the timer ends! Drop your number here: ${publicUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyNumbers = () => {
    if (!pool || pool.contacts.length === 0) return;
    const nums = pool.contacts.map(c => c.phone).join('\n');
    navigator.clipboard.writeText(nums);
    showToast('Copied all phone numbers to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading your admin panel...</p>
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Admin Panel Not Found</h2>
          <p className="text-xs text-slate-400 mt-1">{error || 'Invalid admin key.'}</p>
        </div>
        <button
          type="button"
          onClick={onGoHome}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Home</span>
        </button>
      </div>
    );
  }

  const isClosed = pool.status === 'ended' || timeRemaining.isExpired;
  const filteredContacts = pool.contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-2xl">
        <button
          type="button"
          onClick={onGoHome}
          className="text-slate-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadAdminPool(false)}
            disabled={refreshing}
            className="text-slate-400 hover:text-cyan-400 text-xs flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-800"
            title="Refresh contacts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopyLink('admin')}
            className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800"
            title="Bookmark or save this admin URL"
          >
            {copiedLink === 'admin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink === 'admin' ? 'Admin URL Copied!' : 'Save Admin Link'}</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {actionNotice && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Campaign Overview Hero Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Title & metadata */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isClosed
                  ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                  : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
                <span>{isClosed ? 'Closed' : 'Active Collection'}</span>
              </span>

              <span className="text-xs text-slate-500 font-mono">
                Prefix: <strong className="text-cyan-400">{pool.prefix}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {pool.title}
            </h1>

            {pool.description && (
              <p className="text-xs text-slate-400 max-w-xl">
                {pool.description}
              </p>
            )}
          </div>

          {/* Big Timer Box & Status Controls */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center min-w-[240px] text-center space-y-2 shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isClosed ? 'Collection Status' : 'Timer Remaining'}</span>
            </span>

            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isClosed ? 'text-rose-400' : 'text-cyan-400'}`}>
              {isClosed ? 'EXPIRED' : timeRemaining.formatted}
            </div>

            {/* Quick Timer Controls */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleExtendTimer(60)}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer font-mono"
              >
                +1 Hour
              </button>
              <button
                type="button"
                onClick={() => handleExtendTimer(360)}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer font-mono"
              >
                +6 Hours
              </button>
              <button
                type="button"
                onClick={() => handleExtendTimer(1440)}
                className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer font-mono"
              >
                +24 Hours
              </button>
              {isClosed ? (
                <button
                  type="button"
                  onClick={() => handleToggleStatus('active')}
                  className="text-[11px] bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold"
                >
                  Reopen
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleStatus('ended')}
                  className="text-[11px] bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold"
                >
                  Close Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Primary Download Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download &amp; Export Center</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total: <strong className="text-emerald-400 font-bold">{pool.contacts.length}</strong> contacts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {/* Primary VCF Download */}
            <a
              href={`/api/pools/admin/${adminKey}/export/vcf`}
              download={`${pool.title.replace(/\s+/g, '_')}.vcf`}
              className="sm:col-span-2 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-slate-950 font-black text-sm py-3 px-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.99] cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Download Compiled .VCF ({pool.contacts.length})</span>
            </a>

            {/* CSV */}
            <a
              href={`/api/pools/admin/${adminKey}/export/csv`}
              download={`${pool.title.replace(/\s+/g, '_')}.csv`}
              className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-xs py-3 px-3 rounded-xl transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </a>

            {/* TXT */}
            <button
              type="button"
              onClick={handleCopyNumbers}
              className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-xs py-3 px-3 rounded-xl transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy Numbers</span>
            </button>
          </div>
        </div>

        {/* Share & Invite Section */}
        <div className="mt-6 p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Public Submission Link</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">Send this link to participants</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 truncate">
              {`${window.location.origin}/?pool=${pool.id}`}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => handleCopyLink('public')}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold py-2 px-3.5 rounded-xl transition-all cursor-pointer"
              >
                {copiedLink === 'public' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink === 'public' ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-slate-950 text-xs font-bold py-2 px-3.5 rounded-xl transition-all cursor-pointer"
              >
                <i className="fa-brands fa-whatsapp text-sm" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 rounded-xl cursor-pointer"
                title="View QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Settings Expander */}
        {showSettings && (
          <div className="mt-5 p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 animate-in fade-in">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pool Settings</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Save Prefix</label>
                <input
                  type="text"
                  value={editPrefix}
                  onChange={(e) => setEditPrefix(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAllowPublicDownload}
                    onChange={(e) => setEditAllowPublicDownload(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 w-4 h-4"
                  />
                  <span className="text-slate-300">Allow participants to download compiled VCF after timer ends</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="text-xs font-bold bg-cyan-500 text-slate-950 px-4 py-1.5 rounded-xl cursor-pointer hover:bg-cyan-400 transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Roster Table Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-base">
              Registered Contacts ({pool.contacts.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roster..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Manual add button */}
            <button
              type="button"
              onClick={() => setShowManualAdd(!showManualAdd)}
              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-xs font-semibold py-1.5 px-3 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        {/* Manual Add Drawer */}
        {showManualAdd && (
          <form onSubmit={handleManualAdd} className="p-4 bg-slate-950 border border-cyan-800/40 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400">Add Contact to Pool Manually</span>
              <button
                type="button"
                onClick={() => setShowManualAdd(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Contact Name (e.g. John Doe)"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <input
                type="tel"
                required
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                placeholder={`Phone (e.g. 080... or ${pool.defaultCountryCode}...)`}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
            >
              Add to List
            </button>
          </form>
        )}

        {/* Contacts Roster Table */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/80 text-xs">
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No contacts registered yet.</p>
                <p className="text-[11px] text-slate-600">
                  Share your public link on WhatsApp to begin collecting numbers!
                </p>
              </div>
            ) : (
              filteredContacts.map((c, idx) => {
                const paddedIndex = String(idx + 1).padStart(3, '0');
                const compiledDisplayName = c.name
                  ? `${pool.prefix} ${paddedIndex} - ${c.name}`
                  : `${pool.prefix} ${paddedIndex}`;

                return (
                  <div
                    key={c.id}
                    className="p-3 sm:px-4 flex items-center justify-between hover:bg-slate-900/60 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[11px] font-mono text-slate-500 font-bold w-7 shrink-0">
                        #{paddedIndex}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 truncate">
                          {compiledDisplayName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Joined: {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-emerald-400 font-bold text-xs sm:text-sm">
                        {c.phone}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDeleteContact(c.id, c.name)}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                        title="Remove contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-white text-base">Public Submission QR</h3>
            <p className="text-xs text-slate-400">
              People can scan this with their phone camera to add their contact directly.
            </p>

            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Public Submission QR"
                className="w-48 h-48 mx-auto rounded-2xl border border-cyan-500/20 shadow-lg"
              />
            )}

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
