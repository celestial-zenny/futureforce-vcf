import React, { useState } from 'react';
import { Code2, Download, Copy, Check, X, CheckCircle2 } from 'lucide-react';

interface StandaloneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneModal: React.FC<StandaloneModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/index-standalone.html');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Standalone HTML Deployment</h3>
              <p className="text-xs text-slate-400">Zero-dependency portable single-file edition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">
            Need to host this tool on any standard web hosting (cPanel, GitHub Pages, Netlify, Cloudflare Pages, or simple file sharing) with <strong>zero build steps or Node.js server required</strong>?
          </p>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full Standalone Feature Parity</span>
            </div>
            <ul className="text-slate-400 space-y-1 pl-6 list-disc">
              <li>Client-side vCard 3.0 compilation engine</li>
              <li>Batch contact number parsing with country-code support</li>
              <li>CSV and TXT multi-format export</li>
              <li>Direct Futureforce WhatsApp community integration</li>
              <li>Embedded pure vanilla JS and modern dark UI styling</li>
            </ul>
          </div>

          <p className="text-slate-400">
            The standalone HTML file is located at <code className="text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">/public/index-standalone.html</code> in this project repository.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Direct URL Copied!' : 'Copy File URL'}</span>
          </button>

          <a
            href="/index-standalone.html"
            download="futureforce_vcf_generator.html"
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Download .HTML File</span>
          </a>
        </div>
      </div>
    </div>
  );
};
