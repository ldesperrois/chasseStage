import React from 'react';
import { RotateCcw, X, Heart, Star, ExternalLink, Info } from 'lucide-react';

interface ActionButtonsProps {
  onRewind: () => void;
  onDislike: () => void;
  onSuperlike: () => void;
  onLike: () => void;
  onOpenDetails: () => void;
  onDirectApply?: () => void;
  canRewind: boolean;
  disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onRewind,
  onDislike,
  onSuperlike,
  onLike,
  onOpenDetails,
  onDirectApply,
  canRewind,
  disabled = false,
}) => {
  return (
    <div className="w-full flex items-center justify-center gap-3 sm:gap-5 py-4">
      {/* Rewind / Undo Button */}
      <button
        onClick={onRewind}
        disabled={!canRewind || disabled}
        title="Annuler le dernier swipe (Touche Z ou Backspace)"
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-200 relative group ${
          canRewind && !disabled
            ? 'bg-slate-900 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 hover:scale-110 active:scale-95 shadow-md shadow-amber-500/10'
            : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
        }`}
      >
        <RotateCcw className="w-5 h-5 transition-transform group-hover:-rotate-45" />
        <span className="hidden sm:inline-block absolute -bottom-5 text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
          Z
        </span>
      </button>

      {/* Dislike / Pass Button */}
      <button
        onClick={onDislike}
        disabled={disabled}
        title="Passer cette offre (Flèche Gauche ←)"
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border transition-all duration-200 relative group ${
          !disabled
            ? 'bg-slate-900 border-rose-500/60 text-rose-500 hover:bg-rose-500/20 hover:border-rose-400 hover:scale-110 active:scale-95 shadow-lg shadow-rose-500/20'
            : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
        }`}
      >
        <X className="w-7 h-7 stroke-[2.5]" />
        <span className="hidden sm:inline-block absolute -bottom-5 text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          ←
        </span>
      </button>

      {/* Superlike / Priority Button */}
      <button
        onClick={onSuperlike}
        disabled={disabled}
        title="Superlike / Coup de coeur (Flèche Haut ↑)"
        className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center border transition-all duration-200 relative group ${
          !disabled
            ? 'bg-slate-900 border-sky-500/60 text-sky-400 hover:bg-sky-500/20 hover:border-sky-400 hover:scale-110 active:scale-95 shadow-lg shadow-sky-500/20'
            : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
        }`}
      >
        <Star className="w-6 h-6 fill-sky-400/20" />
        <span className="hidden sm:inline-block absolute -bottom-5 text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          ↑
        </span>
      </button>

      {/* Like / Save Button */}
      <button
        onClick={onLike}
        disabled={disabled}
        title="Sauvegarder dans mes Matchs (Flèche Droite →)"
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border transition-all duration-200 relative group ${
          !disabled
            ? 'bg-slate-900 border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 hover:scale-110 active:scale-95 shadow-lg shadow-emerald-500/20'
            : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
        }`}
      >
        <Heart className="w-7 h-7 fill-emerald-400/20 stroke-[2.5]" />
        <span className="hidden sm:inline-block absolute -bottom-5 text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          →
        </span>
      </button>

      {/* Direct Apply Button */}
      {onDirectApply && (
        <button
          onClick={onDirectApply}
          disabled={disabled}
          title="Ouvrir le lien de candidature (Touche Espace)"
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-200 relative group ${
            !disabled
              ? 'bg-slate-900 border-indigo-500/60 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-400 hover:scale-110 active:scale-95 shadow-md shadow-indigo-500/10'
              : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <ExternalLink className="w-5 h-5" />
          <span className="hidden sm:inline-block absolute -bottom-5 text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Espace
          </span>
        </button>
      )}

      {/* Info Modal Button */}
      <button
        onClick={onOpenDetails}
        disabled={disabled}
        title="Détails complets de l'offre (Touche I)"
        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all duration-200 relative group ${
          !disabled
            ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500 hover:scale-110 active:scale-95'
            : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed'
        }`}
      >
        <Info className="w-5 h-5" />
        <span className="hidden sm:inline-block absolute -bottom-5 text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
          I
        </span>
      </button>
    </div>
  );
};
