import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Cloud, 
  Check, 
  Copy, 
  Smartphone, 
  QrCode, 
  RefreshCw, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import type { MatchedOffer } from '../types/offer';
import { getSyncUrl } from '../services/cloudSync';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncCode: string;
  onUpdateSyncCode: (newCode: string) => Promise<boolean>;
  syncStatus: 'synced' | 'syncing' | 'error' | 'idle';
  lastSyncTime: Date | null;
  onForceSync: () => Promise<void>;
  matches: MatchedOffer[];
  onImportBackup: (matches: MatchedOffer[]) => void;
}

export const CloudSyncModal = ({
  isOpen,
  onClose,
  syncCode,
  onUpdateSyncCode,
  syncStatus,
  lastSyncTime,
  onForceSync,
  matches,
  onImportBackup,
}: CloudSyncModalProps) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen) return null;

  const syncUrl = getSyncUrl(syncCode);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    syncUrl
  )}&bgcolor=0f172a&color=f8fafc`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(syncUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleJoinCode = async () => {
    if (!joinCodeInput.trim()) return;
    setIsJoining(true);
    setFeedback(null);
    try {
      const ok = await onUpdateSyncCode(joinCodeInput.trim());
      if (ok) {
        setFeedback({
          type: 'success',
          message: `Connecté avec succès au Cloud ${joinCodeInput.trim().toUpperCase()} !`,
        });
        setJoinCodeInput('');
      } else {
        setFeedback({
          type: 'error',
          message: 'Impossible de synchroniser avec ce code. Vérifie la saisie.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erreur de connexion au Cloud.' });
    } finally {
      setIsJoining(false);
    }
  };

  const handleDownloadBackup = () => {
    const backupData = {
      app: 'StageMatch',
      version: '1.0',
      syncCode,
      exportedAt: new Date().toISOString(),
      matches,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `StageMatch_Sauvegarde_${syncCode}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.matches)) {
          onImportBackup(parsed.matches);
          setFeedback({
            type: 'success',
            message: `${parsed.matches.length} candidatures restaurées depuis la sauvegarde locale !`,
          });
        } else {
          setFeedback({ type: 'error', message: 'Fichier de sauvegarde invalide.' });
        }
      } catch {
        setFeedback({ type: 'error', message: 'Erreur de lecture du fichier JSON.' });
      }
    };
    reader.readAsText(file);
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
          className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 z-10 flex flex-col max-h-[88vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Synchronisation Cloud</h3>
                <p className="text-xs text-slate-400">
                  Conserve et synchronise tes matchs entre ton smartphone et ton PC
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
            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Current Sync Code Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-500/30 text-center relative overflow-hidden">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                Ton Code de Synchronisation Cloud Personnel
              </span>
              <div className="flex items-center justify-center gap-3 my-2">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-widest bg-slate-950 px-5 py-2 rounded-2xl border border-indigo-500/40 shadow-inner">
                  {syncCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 text-xs font-semibold"
                  title="Copier le code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-2">
                Tape ce code sur n'importe quel autre appareil pour retrouver instantanément tes {matches.length} offres sauvegardées et tes swipes.
              </p>

              {/* Status Indicator */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                      : syncStatus === 'syncing'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-400'
                  }`}
                />
                <span>
                  {syncStatus === 'synced'
                    ? 'Cloud synchronisé'
                    : syncStatus === 'syncing'
                    ? 'Envoi vers le Cloud...'
                    : 'Hors ligne / En attente'}
                </span>
                {lastSyncTime && (
                  <span className="text-slate-500 text-[11px]">
                    (dernière sync à {lastSyncTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
                <button
                  onClick={onForceSync}
                  className="ml-2 text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px] font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {/* Connect Smartphone via Magic Link / QR Code */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Ouvrir sur ton smartphone</span>
                </div>
                <button
                  onClick={() => setShowQrCode(!showQrCode)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQrCode ? 'Masquer QR Code' : 'Afficher QR Code'}</span>
                </button>
              </div>

              {showQrCode && (
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800 my-2">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Synchronisation"
                    className="w-48 h-48 rounded-xl p-2 bg-slate-900 border border-slate-700 shadow-md"
                  />
                  <p className="text-[11px] text-slate-400 mt-2 text-center">
                    Scanne ce QR code avec l'appareil photo de ton téléphone pour ouvrir directement StageMatch connecté à tes matchs !
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={syncUrl}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 select-all"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition shrink-0"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Lien copié' : 'Copier lien'}</span>
                </button>
              </div>
            </div>

            {/* Connect existing code (Join) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Rejoindre un autre code Cloud existant</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="Ex: ENSTA-XXXX"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleJoinCode}
                  disabled={!joinCodeInput.trim() || isJoining}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    joinCodeInput.trim() && !isJoining
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isJoining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Connecter</span>
                </button>
              </div>
            </div>

            {/* Local backup options (Offline Safety) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Sauvegarde de sécurité hors-ligne</div>
                  <div className="text-[11px] text-slate-400">
                    Télécharge une copie de secours complète de tes candidatures
                  </div>
                </div>

                <button
                  onClick={handleDownloadBackup}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Exporter .json</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Restaurer un fichier de sauvegarde :</span>
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Importer .json</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleUploadBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
