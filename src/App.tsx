import React, { useState, useEffect } from 'react';
import {
  Link2,
  Users,
  UserCheck,
  Code2,
  ShieldCheck,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { CreatePoolCard } from './components/CreatePoolCard';
import { MyCampaignsList } from './components/MyCampaignsList';
import { ParticipantSubmitView } from './components/ParticipantSubmitView';
import { AdminPanelView } from './components/AdminPanelView';
import { BulkGenerator } from './components/BulkGenerator';
import { SingleCardGenerator } from './components/SingleCardGenerator';
import { WhatsAppCommunityCard } from './components/WhatsAppCommunityCard';
import { StandaloneModal } from './components/StandaloneModal';

const WHATSAPP_INVITE_URL = "https://chat.whatsapp.com/K6cRji0kD4Y6tE98374oj3";

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'participant' | 'admin'>('home');
  const [activePoolId, setActivePoolId] = useState<string>('');
  const [activeAdminKey, setActiveAdminKey] = useState<string>('');
  const [homeTab, setHomeTab] = useState<'create_pool' | 'my_pools' | 'instant_bulk' | 'single'>('create_pool');
  const [showStandaloneModal, setShowStandaloneModal] = useState<boolean>(false);

  // Sync state with URL query parameters
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const pool = params.get('pool');
      const admin = params.get('admin');

      if (pool) {
        setActivePoolId(pool);
        setCurrentView('participant');
      } else if (admin) {
        setActiveAdminKey(admin);
        setCurrentView('admin');
      } else {
        setCurrentView('home');
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const navigateToHome = () => {
    window.history.pushState({}, '', window.location.pathname);
    setCurrentView('home');
    setActivePoolId('');
    setActiveAdminKey('');
  };

  const navigateToAdmin = (adminKey: string) => {
    window.history.pushState({}, '', `?admin=${adminKey}`);
    setActiveAdminKey(adminKey);
    setCurrentView('admin');
  };

  const handlePoolCreated = (poolId: string, adminKey: string) => {
    navigateToAdmin(adminKey);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center px-4 py-8 relative selection:bg-cyan-500 selection:text-black">
      {/* Dynamic ambient background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[750px] h-[360px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[550px] h-[360px] bg-emerald-600/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="w-full max-w-3xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-2.5 text-xs">
        <button
          type="button"
          onClick={navigateToHome}
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 px-3.5 py-1.5 rounded-full shadow-sm cursor-pointer transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold text-slate-200">Futureforce VCF Drop</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-mono text-[11px]">Instant Links &amp; Admin Panel</span>
        </button>

        <div className="flex items-center gap-2">
          {currentView !== 'home' && (
            <button
              type="button"
              onClick={navigateToHome}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
            >
              + Create New Link
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowStandaloneModal(true)}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-3.5 py-1.5 rounded-full text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Standalone HTML</span>
          </button>
        </div>
      </header>

      {/* View Routing */}
      <main className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center">
        {currentView === 'participant' && activePoolId ? (
          <ParticipantSubmitView
            poolId={activePoolId}
            onGoHome={navigateToHome}
          />
        ) : currentView === 'admin' && activeAdminKey ? (
          <AdminPanelView
            adminKey={activeAdminKey}
            onGoHome={navigateToHome}
          />
        ) : (
          /* Home Screen */
          <div className="space-y-6 animate-in fade-in">
            {/* Branding Header Banner */}
            <div className="flex flex-col items-center text-center">
              {/* Futureforce Logo Graphic Badge */}
              <div className="mb-4">
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-2xl shadow-xl shadow-cyan-950/20">
                  <div className="bg-black text-white px-4 py-1 sm:px-5 sm:py-1.5 rounded-xl font-black text-lg sm:text-xl tracking-wider shadow-inner border border-slate-800/60">
                    FUTURE
                  </div>
                  <div className="text-slate-100 font-black text-lg sm:text-xl tracking-wider pr-3">
                    FORCE
                  </div>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                VCF Contact Collection Platform
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg leading-relaxed">
                Create a timed collection link, share it on WhatsApp for people to submit their numbers, and download the compiled <code className="text-cyan-400 font-mono">.vcf</code> file from your private admin panel — with <strong className="text-white font-semibold">no account needed</strong>.
              </p>

              {/* Home Navigation Tabs */}
              <div className="mt-6 p-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setHomeTab('create_pool')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    homeTab === 'create_pool'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Create VCF Link (Timed)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHomeTab('my_pools')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    homeTab === 'my_pools'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>My Active Links</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHomeTab('instant_bulk')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    homeTab === 'instant_bulk'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Raw Compiler</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHomeTab('single')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    homeTab === 'single'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Single vCard &amp; QR</span>
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            {homeTab === 'create_pool' && (
              <div className="space-y-6">
                <CreatePoolCard onPoolCreated={handlePoolCreated} />
                <MyCampaignsList onOpenAdmin={navigateToAdmin} />
              </div>
            )}

            {homeTab === 'my_pools' && (
              <MyCampaignsList onOpenAdmin={navigateToAdmin} />
            )}

            {homeTab === 'instant_bulk' && (
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-5 sm:p-8 shadow-2xl">
                <div className="mb-5 pb-4 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">Instant Raw Contact Compiler</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Paste raw text or CSV contacts directly to compile a downloadable .vcf file immediately.
                  </p>
                </div>
                <BulkGenerator />
              </div>
            )}

            {homeTab === 'single' && (
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-5 sm:p-8 shadow-2xl">
                <div className="mb-5 pb-4 border-b border-slate-800">
                  <h3 className="text-base font-bold text-white">Single Contact Card &amp; QR Generator</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate an individual business vCard file and scannable QR code.
                  </p>
                </div>
                <SingleCardGenerator />
              </div>
            )}

            {/* WhatsApp Community Gateway */}
            <div className="pt-2">
              <WhatsAppCommunityCard inviteUrl={WHATSAPP_INVITE_URL} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center mt-10 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300 tracking-wide flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Futureforce VCF Drop Platform</span>
        </p>
        <p className="text-[11px] text-slate-500">
          RFC 2426 vCard 3.0 Standard &bull; Zero login required &bull; All data isolated by secure tokens &copy; {new Date().getFullYear()}
        </p>
      </footer>

      {/* Standalone Code Exporter Modal */}
      <StandaloneModal
        isOpen={showStandaloneModal}
        onClose={() => setShowStandaloneModal(false)}
      />
    </div>
  );
}
