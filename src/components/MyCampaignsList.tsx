import React, { useState, useEffect } from 'react';
import {
  Clock,
  ExternalLink,
  Shield,
  Trash2,
  Key,
  FolderOpen
} from 'lucide-react';
import { SavedLocalCampaign } from '../types';
import { calculateTimeRemaining } from '../utils/time';

interface MyCampaignsListProps {
  onOpenAdmin: (adminKey: string) => void;
}

export const MyCampaignsList: React.FC<MyCampaignsListProps> = ({ onOpenAdmin }) => {
  const [campaigns, setCampaigns] = useState<SavedLocalCampaign[]>([]);
  const [manualKey, setManualKey] = useState<string>('');

  const loadSaved = () => {
    try {
      const list = JSON.parse(localStorage.getItem('futureforce_saved_pools') || '[]');
      setCampaigns(list);
    } catch {
      setCampaigns([]);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    localStorage.setItem('futureforce_saved_pools', JSON.stringify(updated));
  };

  const handleLookupManualKey = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualKey.trim();
    if (!clean) return;

    // Check if user pasted a full URL e.g. ...?admin=adm_xxx or just the key
    if (clean.includes('admin=')) {
      const match = clean.match(/admin=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        onOpenAdmin(match[1]);
        return;
      }
    }

    onOpenAdmin(clean);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white text-base">
            Your Active Collection Links
          </h3>
        </div>

        {/* Enter key manual access */}
        <form onSubmit={handleLookupManualKey} className="flex items-center gap-2">
          <div className="relative">
            <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={manualKey}
              onChange={(e) => setManualKey(e.target.value)}
              placeholder="Paste Admin Key or URL..."
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold py-1.5 px-3 rounded-xl transition-all cursor-pointer"
          >
            Open
          </button>
        </form>
      </div>

      {campaigns.length === 0 ? (
        <div className="p-6 bg-slate-950 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-500 space-y-1">
          <p>You haven't generated any collection links on this browser yet.</p>
          <p className="text-[11px] text-slate-600">
            Create your first link above, or paste an existing admin key to manage your collection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {campaigns.map((camp) => {
            const time = calculateTimeRemaining(camp.expiresAt);
            const isClosed = time.isExpired;

            return (
              <div
                key={camp.id}
                onClick={() => onOpenAdmin(camp.adminKey)}
                className="bg-slate-950 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm truncate group-hover:text-cyan-400 transition-colors">
                      {camp.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Prefix: {camp.prefix} &bull; ID: {camp.id}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleRemove(camp.id, e)}
                    className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                    title="Remove from this browser's list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs">
                  <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold ${
                    isClosed ? 'text-rose-400' : 'text-cyan-400'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{isClosed ? 'Expired' : time.formatted}</span>
                  </span>

                  <span className="text-cyan-400 text-[11px] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Admin Panel</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
