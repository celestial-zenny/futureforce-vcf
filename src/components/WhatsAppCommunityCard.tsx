import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ExternalLink, Copy, Check, QrCode, ShieldCheck, Users } from 'lucide-react';

interface WhatsAppCommunityCardProps {
  inviteUrl: string;
}

export const WhatsAppCommunityCard: React.FC<WhatsAppCommunityCardProps> = ({ inviteUrl }) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(inviteUrl, {
      width: 220,
      margin: 1.5,
      color: {
        dark: '#020617', // slate-950
        light: '#25D366' // WhatsApp green
      }
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error(err));
  }, [inviteUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-slate-950/90 border border-emerald-900/50 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-2xl group">
      {/* Background ambient lighting glow */}
      <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-[#25D366] shadow-lg shadow-emerald-900/40">
            <i className="fa-brands fa-whatsapp text-3xl"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Join Futureforce WhatsApp Ecosystem
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-950/90 border border-emerald-800/80 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Gateway</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Network with fellow members, access shared contact lists, and gain WhatsApp status reach.
            </p>
          </div>
        </div>

        {/* QR Code toggle */}
        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 p-2 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
          title="Toggle QR Code"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
        </button>
      </div>

      {/* Optional QR Code Popup View */}
      {showQr && (
        <div className="mb-4 bg-slate-900/90 border border-emerald-800/40 rounded-xl p-4 flex flex-col items-center justify-center animate-in fade-in">
          <p className="text-xs text-slate-300 font-medium mb-3">
            Scan with your phone camera to join instantly:
          </p>
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="WhatsApp Group QR Code"
              className="w-40 h-40 rounded-xl border border-emerald-500/30 shadow-lg"
            />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center text-slate-500 text-xs">
              Loading QR...
            </div>
          )}
          <span className="text-[11px] text-emerald-400 mt-2 font-mono">
            chat.whatsapp.com
          </span>
        </div>
      )}

      {/* Primary Join Button */}
      <a
        href={inviteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-slate-950 font-black text-base py-3.5 px-5 rounded-xl transition-all duration-200 shadow-xl shadow-emerald-600/20 cursor-pointer"
      >
        <i className="fa-brands fa-whatsapp text-2xl text-slate-950"></i>
        <span>Join Official WhatsApp Community</span>
        <ExternalLink className="w-4 h-4 text-slate-950" />
      </a>

      {/* Footer info & link copy */}
      <div className="flex items-center justify-between mt-3.5 text-xs text-slate-400 pt-1">
        <span className="flex items-center gap-1.5 text-slate-400">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active community members network</span>
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors font-medium text-[11px]"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
        </button>
      </div>
    </div>
  );
};
