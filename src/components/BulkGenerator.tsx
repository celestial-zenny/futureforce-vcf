import React, { useState, useId } from 'react';
import {
  FileText,
  Download,
  Trash2,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  Settings2,
  FileSpreadsheet,
  Layers,
  Edit2
} from 'lucide-react';
import { ParsedContact, BulkConfig, NameFormatStyle } from '../types';
import {
  parseRawText,
  generateVcfString,
  generateCsvString,
  generateTxtString,
  downloadBlobFile
} from '../utils/vcf';

interface BulkGeneratorProps {
  onContactsGenerated?: (count: number) => void;
}

export const BulkGenerator: React.FC<BulkGeneratorProps> = ({ onContactsGenerated }) => {
  const [inputText, setInputText] = useState<string>('');
  const [config, setConfig] = useState<BulkConfig>({
    prefix: 'Futureforce',
    startNumber: 1,
    zeroPad: 3,
    autoCountryCode: true,
    defaultCountryCode: '+234',
    removeDuplicates: true,
    fileName: 'Futureforce_Contacts.vcf',
    nameFormat: 'prefix_name'
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>('');
  const [editedPhone, setEditedPhone] = useState<string>('');
  const fileInputId = useId();

  const sampleData = `John Doe, 08012345678
Sarah Connor, +14155552671
Alex Rivera - +447911123456
09098765432
08123456789
David Sterling, +2348123456789
Elena Rostova: +33612345678
Michael Scott - 07034567890
08012345678`;

  const { contacts, duplicateCount, invalidCount } = parseRawText(inputText, config);

  // Filtered contacts based on search query
  const filteredContacts = contacts.filter(c =>
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleDownloadVcf = () => {
    if (contacts.length === 0) return;
    const vcfContent = generateVcfString(contacts);
    const finalFileName = config.fileName.trim().endsWith('.vcf') 
      ? config.fileName.trim() 
      : `${config.fileName.trim() || 'contacts'}.vcf`;
    downloadBlobFile(vcfContent, finalFileName, 'text/vcard');
    setSuccessNotice(`Downloaded ${contacts.length} contacts as ${finalFileName}`);
    if (onContactsGenerated) onContactsGenerated(contacts.length);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  const handleDownloadCsv = () => {
    if (contacts.length === 0) return;
    const csvContent = generateCsvString(contacts);
    const baseName = config.fileName.replace(/\.vcf$/i, '') || 'contacts';
    downloadBlobFile(csvContent, `${baseName}.csv`, 'text/csv');
    setSuccessNotice(`Exported ${contacts.length} contacts as CSV.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleDownloadTxt = () => {
    if (contacts.length === 0) return;
    const txtContent = generateTxtString(contacts);
    const baseName = config.fileName.replace(/\.vcf$/i, '') || 'contacts';
    downloadBlobFile(txtContent, `${baseName}.txt`, 'text/plain');
    setSuccessNotice(`Exported ${contacts.length} numbers as TXT.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleCopyNumbers = () => {
    if (contacts.length === 0) return;
    const numbersList = contacts.map(c => c.phone).join('\n');
    navigator.clipboard.writeText(numbersList);
    setCopiedType('numbers');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputText(prev => prev ? `${prev}\n${text}` : text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRemoveContact = (phoneToRemove: string) => {
    const lines = inputText.split(/\r?\n/).filter(line => {
      const cleaned = line.replace(/[^\d+]/g, '');
      return !cleaned.includes(phoneToRemove.replace(/[^\d]/g, '').slice(-8));
    });
    setInputText(lines.join('\n'));
  };

  const handleSaveEdit = (originalRaw: string) => {
    if (!editedPhone.trim()) return;
    const lines = inputText.split(/\r?\n/).map(line => {
      if (line === originalRaw) {
        return editedName.trim() ? `${editedName.trim()}, ${editedPhone.trim()}` : editedPhone.trim();
      }
      return line;
    });
    setInputText(lines.join('\n'));
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Matrix */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Compiler Settings</span>
          </span>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>{showAdvanced ? 'Simple View' : 'Advanced Settings'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Prefix Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Contact Save Prefix
            </label>
            <input
              type="text"
              value={config.prefix}
              onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
              placeholder="e.g. Futureforce, Member"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Starting Count */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Starting Counter
            </label>
            <input
              type="number"
              min="1"
              value={config.startNumber}
              onChange={(e) => setConfig({ ...config, startNumber: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono transition-all"
            />
          </div>

          {/* Output File Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Output File (.vcf)
            </label>
            <input
              type="text"
              value={config.fileName}
              onChange={(e) => setConfig({ ...config, fileName: e.target.value })}
              placeholder="Futureforce_Contacts.vcf"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono transition-all"
            />
          </div>
        </div>

        {/* Advanced Config Expansion */}
        {showAdvanced && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in">
            {/* Name Formatting Style */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Name Format Style
              </label>
              <select
                value={config.nameFormat}
                onChange={(e) => setConfig({ ...config, nameFormat: e.target.value as NameFormatStyle })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="prefix_name">Prefix - Extracted Name (Default)</option>
                <option value="prefix_number">Prefix + Number Only (001, 002)</option>
                <option value="name_prefix">Extracted Name (Prefix)</option>
                <option value="name_only">Extracted Name Only</option>
              </select>
            </div>

            {/* Zero Padding */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Zero Padding Digits
              </label>
              <select
                value={config.zeroPad}
                onChange={(e) => setConfig({ ...config, zeroPad: parseInt(e.target.value) || 3 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="1">No padding (1, 2, 3...)</option>
                <option value="2">2 Digits (01, 02, 03...)</option>
                <option value="3">3 Digits (001, 002, 003...)</option>
                <option value="4">4 Digits (0001, 0002...)</option>
              </select>
            </div>

            {/* Default Country Code */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Default Country Code</span>
                <span className="text-slate-500 font-normal">e.g. +234</span>
              </label>
              <input
                type="text"
                value={config.defaultCountryCode}
                onChange={(e) => setConfig({ ...config, defaultCountryCode: e.target.value })}
                placeholder="+234"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Toggles */}
            <div className="sm:col-span-3 flex flex-wrap items-center gap-5 pt-2 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.autoCountryCode}
                  onChange={(e) => setConfig({ ...config, autoCountryCode: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                <span>Auto-prepend country code to local numbers (e.g. <code>080... &rarr; {config.defaultCountryCode}80...</code>)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.removeDuplicates}
                  onChange={(e) => setConfig({ ...config, removeDuplicates: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                <span>Filter duplicate numbers automatically</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Input Textarea Area */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Paste Contacts & Numbers</span>
          </label>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setInputText(sampleData)}
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Load Sample</span>
            </button>

            <span className="text-slate-700">|</span>

            <label
              htmlFor={fileInputId}
              className="text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <UploadCloud className="w-3 h-3" />
              <span>Import File (.txt/.csv)</span>
            </label>
            <input
              id={fileInputId}
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {inputText && (
              <>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={8}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Paste raw contacts or numbers here (any format):
John Doe, 08012345678
Sarah Connor - +14155552671
+2349098765432
+447911123456
08123456789`}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all leading-relaxed resize-y"
          />

          {/* Real-time stats floating pill */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-900/95 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono shadow-md">
            <span className="text-slate-400">Valid:</span>
            <span className={`font-bold ${contacts.length > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              {contacts.length}
            </span>
            {duplicateCount > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400">{duplicateCount} dupes</span>
              </>
            )}
            {invalidCount > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-rose-400">{invalidCount} skipped</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Notice */}
      {successNotice && (
        <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs px-4 py-3 rounded-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Export Action Center */}
      <div className="space-y-3">
        {/* Primary Download Button */}
        <button
          type="button"
          onClick={handleDownloadVcf}
          disabled={contacts.length === 0}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-slate-950 font-black text-base py-4 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-cyan-500/20 active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5 text-slate-950" />
          <span>Download VCF File ({contacts.length} Contacts)</span>
        </button>

        {/* Multi-format export utilities */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={contacts.length === 0}
            className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTxt}
            disabled={contacts.length === 0}
            className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export TXT</span>
          </button>

          <button
            type="button"
            onClick={handleCopyNumbers}
            disabled={contacts.length === 0}
            className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copiedType === 'numbers' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{copiedType === 'numbers' ? 'Copied!' : 'Copy Numbers'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Contact Inspector Table */}
      {contacts.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-200">
                Contact Inspector &amp; Preview ({contacts.length})
              </h4>
            </div>

            {/* Quick search filter */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter preview..."
                className="bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Contact rows */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
            {filteredContacts.length === 0 ? (
              <p className="text-slate-500 text-center py-4 text-xs">No contacts match filter</p>
            ) : (
              filteredContacts.map((c) => {
                const isEditing = editingId === c.id;

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 px-3 py-2 rounded-xl transition-all"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="bg-slate-950 border border-cyan-500 px-2 py-1 rounded text-xs text-white flex-1"
                        />
                        <input
                          type="text"
                          value={editedPhone}
                          onChange={(e) => setEditedPhone(e.target.value)}
                          className="bg-slate-950 border border-cyan-500 px-2 py-1 rounded text-xs text-emerald-400 w-36 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(c.originalRaw)}
                          className="bg-cyan-500 text-slate-950 px-2 py-1 rounded font-bold text-[11px] cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-slate-400 hover:text-white text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-slate-200 truncate max-w-[220px] sm:max-w-xs font-sans font-medium">
                          {c.fullName}
                        </span>

                        <div className="flex items-center gap-3">
                          <span className="text-emerald-400 font-bold">{c.phone}</span>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(c.id);
                              setEditedName(c.fullName);
                              setEditedPhone(c.phone);
                            }}
                            title="Edit row"
                            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveContact(c.phone)}
                            title="Remove from list"
                            className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
