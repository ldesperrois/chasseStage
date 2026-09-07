import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Terminal, 
  ShieldCheck, 
  Upload, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Cpu, 
  Copy, 
  Check 
} from 'lucide-react';
import type { InternshipOffer } from '../types/offer';

interface ScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportOffers: (offers: InternshipOffer[]) => boolean;
  onResetOffers: () => void;
  currentOffersCount: number;
}

export const ScraperModal = ({

  isOpen,
  onClose,
  onImportOffers,
  onResetOffers,
  currentOffersCount,
}: ScraperModalProps) => {


  const [jsonInput, setJsonInput] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText('python3 scraper/main.py');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const success = onImportOffers(parsed as InternshipOffer[]);
          if (success) {
            setImportStatus({
              type: 'success',
              message: `${parsed.length} offres importées avec succès dans StageMatch !`,
            });
          } else {
            setImportStatus({ type: 'error', message: 'Format invalide ou tableau vide.' });
          }
        } else {
          setImportStatus({ type: 'error', message: 'Le fichier JSON doit contenir une liste d\'offres.' });
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Erreur de syntaxe JSON dans le fichier importé.' });
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const success = onImportOffers(parsed as InternshipOffer[]);
        if (success) {
          setImportStatus({
            type: 'success',
            message: `${parsed.length} nouvelles offres chargées !`,
          });
          setJsonInput('');
        }
      } else {
        setImportStatus({ type: 'error', message: 'Le JSON doit être un tableau d\'offres valides.' });
      }
    } catch {
      setImportStatus({ type: 'error', message: 'Syntaxe JSON invalide. Vérifie le copier-coller.' });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 z-10 flex flex-col max-h-[88vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Scrappeur & Gestion des Données</h3>
                <p className="text-xs text-slate-400">
                  Pipeline anti-captcha Python & injection d'offres en direct
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-5 space-y-6">
            {/* Anti-Captcha Highlights */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Architecture Anti-Détection & Anti-Captcha</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Le script Python inclus dans le dossier <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono">scraper/</code> contourne les blocages Cloudflare et DataDome :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Empreinte TLS / JA3 réelle via <strong className="text-white">curl_cffi</strong></span>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Rotation headers complets (Sec-Ch-Ua, Accept)</span>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Délais pseudo-aléatoires humains (Jitter)</span>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Filtre strict ENSTA (10 sem. min, Mai-Août)</span>
                </div>
              </div>
            </div>

            {/* Run Command Snippet */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Lancer le scrappeur en local
              </label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-slate-500">$</span>
                  <span>python3 scraper/main.py</span>
                </div>
                <button
                  onClick={handleCopyCommand}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 shrink-0 transition"
                >
                  {copiedCmd ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Le script met à jour automatiquement <code className="text-indigo-400 font-mono">src/data/offers.json</code> et <code className="text-indigo-400 font-mono">public/data/offers.json</code>.
              </p>
            </div>

            {/* Import options */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Importer des offres JSON
              </label>

              {importStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {importStatus.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/30 hover:bg-slate-800/60 transition">
                  <Upload className="w-5 h-5 text-indigo-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-200">Uploader un fichier .json</span>
                  <span className="text-[10px] text-slate-500">Généré par le scrappeur</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Paste JSON */}
              <div className="space-y-2 mt-2">
                <textarea
                  rows={3}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Ou collez directement un tableau JSON d'offres ici..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
                {jsonInput.trim() && (
                  <button
                    onClick={handlePasteImport}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                  >
                    Valider le JSON
                  </button>
                )}
              </div>
            </div>

            {/* Catalog Info & Reset */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Catalogue actuel : {currentOffersCount} offres chargées</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Offres qualifiées pour étudiants ENSTA Bretagne
                </div>
              </div>

              <button
                onClick={() => {
                  onResetOffers();
                  setImportStatus({ type: 'success', message: 'Catalogue réinitialisé avec les offres officielles !' });
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurer défaut</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
