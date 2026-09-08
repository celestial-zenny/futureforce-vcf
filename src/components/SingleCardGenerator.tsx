import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  User,
  Download,
  QrCode,
  Building,
  Mail,
  Phone,
  Globe,
  MessageCircle,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { SingleCardData } from '../types';
import { generateSingleVCardString, downloadBlobFile } from '../utils/vcf';

export const SingleCardGenerator: React.FC = () => {
  const [card, setCard] = useState<SingleCardData>({
    firstName: 'Futureforce',
    lastName: 'Admin',
    organization: 'Futureforce Community',
    title: 'Lead Coordinator',
    phone: '+2348012345678',
    email: 'community@futureforce.org',
    website: 'https://chat.whatsapp.com/K6cRji0kD4Y6tE98374oj3',
    whatsappUrl: 'https://chat.whatsapp.com/K6cRji0kD4Y6tE98374oj3',
    note: 'Official Futureforce Community Contact & Coordinator'
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedVcf, setCopiedVcf] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const vcfString = generateSingleVCardString(card);

  useEffect(() => {
    // Generate QR Code with vCard payload
    QRCode.toDataURL(vcfString, {
      width: 250,
      margin: 1.5,
      color: {
        dark: '#020617', // slate-950
        light: '#38bdf8' // sky-400 / cyan
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error', err));
  }, [vcfString]);

  const handleDownloadSingleVcf = () => {
    const fileName = `${[card.firstName, card.lastName].filter(Boolean).join('_').toLowerCase() || 'contact'}.vcf`;
    downloadBlobFile(vcfString, fileName, 'text/vcard');
  };

  const handleCopyVcf = () => {
    navigator.clipboard.writeText(vcfString);
    setCopiedVcf(true);
    setTimeout(() => setCopiedVcf(false), 2000);
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${[card.firstName, card.lastName].filter(Boolean).join('_').toLowerCase() || 'contact'}_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Contact Editor Fields */}
        <div className="space-y-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Digital Business Card Details</span>
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={card.firstName}
                onChange={(e) => setCard({ ...card, firstName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                value={card.lastName}
                onChange={(e) => setCard({ ...card, lastName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-cyan-400" />
                <span>Phone / WhatsApp</span>
              </label>
              <input
                type="text"
                value={card.phone}
                onChange={(e) => setCard({ ...card, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-cyan-400" />
                <span>Email</span>
              </label>
              <input
                type="email"
                value={card.email}
                onChange={(e) => setCard({ ...card, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-cyan-400" />
                <span>Organization</span>
              </label>
              <input
                type="text"
                value={card.organization}
                onChange={(e) => setCard({ ...card, organization: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Role / Title</label>
              <input
                type="text"
                value={card.title}
                onChange={(e) => setCard({ ...card, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Website or Community Link</span>
            </label>
            <input
              type="text"
              value={card.website}
              onChange={(e) => setCard({ ...card, website: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-cyan-400" />
              <span>Bio / Note</span>
            </label>
            <input
              type="text"
              value={card.note}
              onChange={(e) => setCard({ ...card, note: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Live Card & QR Code Preview */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-4 pb-2 border-b border-slate-800/80">
            <span className="font-semibold flex items-center gap-1.5 text-slate-300">
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live vCard QR Pass</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">Scan with camera to save</span>
          </div>

          {/* QR Code Canvas */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/90 shadow-xl mb-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="vCard QR Code"
                className="w-44 h-44 rounded-xl border border-cyan-500/20"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-slate-500 text-xs">
                Generating QR...
              </div>
            )}
          </div>

          {/* Card Summary Badge */}
          <div className="w-full bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 mb-4 text-left">
            <h4 className="text-sm font-bold text-white truncate">
              {[card.firstName, card.lastName].filter(Boolean).join(' ') || 'Admin Contact'}
            </h4>
            <p className="text-xs text-cyan-400 truncate">{card.title || card.organization || 'Coordinator'}</p>
            <p className="text-xs text-slate-400 font-mono mt-1 truncate">{card.phone}</p>
          </div>

          {/* Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadSingleVcf}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>Download .VCF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQrImage}
              className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save QR Code</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyVcf}
            className="mt-3 text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copiedVcf ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedVcf ? 'vCard Code Copied!' : 'Copy raw vCard code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
