import React, { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { SwipeCard } from './SwipeCard';
import { ActionButtons } from './ActionButtons';
import type { InternshipOffer } from '../types/offer';

import { Sparkles, RotateCcw, Heart, Filter } from 'lucide-react';

interface SwipeDeckProps {
  offers: InternshipOffer[];
  onLike: (offer: InternshipOffer) => void;
  onDislike: (offer: InternshipOffer) => void;
  onSuperlike: (offer: InternshipOffer) => void;
  onRewind: () => void;
  onResetDeck: () => void;
  onOpenDetails: (offer: InternshipOffer) => void;
  onOpenFilters: () => void;
  onViewMatches: () => void;
  canRewind: boolean;
  matchesCount: number;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  offers,
  onLike,
  onDislike,
  onSuperlike,
  onRewind,
  onResetDeck,
  onOpenDetails,
  onOpenFilters,
  onViewMatches,
  canRewind,
  matchesCount,
}) => {
  const currentOffer = offers[0] || null;
  const nextOffer = offers[1] || null;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (!currentOffer) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onLike(currentOffer);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onDislike(currentOffer);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onSuperlike(currentOffer);
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        onOpenDetails(currentOffer);
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        window.open(currentOffer.applyUrl, '_blank', 'noopener,noreferrer');
      } else if (e.key === 'Backspace' || e.key.toLowerCase() === 'z') {
        if (canRewind) {
          e.preventDefault();
          onRewind();
        }
      }
    },
    [currentOffer, onLike, onDislike, onSuperlike, onOpenDetails, canRewind, onRewind]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#38bdf8', '#f59e0b'],
    });
  };

  const handleLikeWithConfetti = (offer: InternshipOffer) => {
    triggerConfetti();
    onLike(offer);
  };

  const handleSuperlikeWithConfetti = (offer: InternshipOffer) => {
    triggerConfetti();
    onSuperlike(offer);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center flex-1 justify-between px-3 py-2">
      {/* Top Deck Info Bar */}
      <div className="w-full flex items-center justify-between text-xs text-slate-400 px-2 py-1 mb-2">
        <span className="font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{offers.length} offre{offers.length > 1 ? 's' : ''} disponible{offers.length > 1 ? 's' : ''}</span>
        </span>

        <button
          onClick={onOpenFilters}
          className="hover:text-slate-200 transition flex items-center gap-1 font-medium text-slate-400 hover:text-indigo-400"
        >
          <Filter className="w-3 h-3" />
          <span>Filtres</span>
        </button>
      </div>

      {/* Card Stack Container */}
      <div className="relative w-full aspect-[1/1.42] max-h-[580px] min-h-[440px] flex items-center justify-center">
        {currentOffer ? (
          <>
            {/* Background card preview (depth effect) */}
            {nextOffer && (
              <SwipeCard
                key={nextOffer.id}
                offer={nextOffer}
                isFront={false}
                onSwipeRight={() => {}}
                onSwipeLeft={() => {}}
                onSwipeUp={() => {}}
                onOpenDetails={() => {}}
              />
            )}

            {/* Front active card */}
            <SwipeCard
              key={currentOffer.id}
              offer={currentOffer}
              isFront={true}
              onSwipeRight={() => handleLikeWithConfetti(currentOffer)}
              onSwipeLeft={() => onDislike(currentOffer)}
              onSwipeUp={() => handleSuperlikeWithConfetti(currentOffer)}
              onOpenDetails={() => onOpenDetails(currentOffer)}
            />
          </>
        ) : (
          /* Empty State */
          <div className="w-full h-full rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Tu as fait le tour du deck ! 🎉
            </h3>

            <p className="text-sm text-slate-400 max-w-xs mb-6 leading-relaxed">
              Toutes les offres correspondant à tes critères ont été passées en revue. Tu as déjà{' '}
              <strong className="text-emerald-400 font-semibold">{matchesCount} offre{matchesCount > 1 ? 's' : ''} sauvegardée{matchesCount > 1 ? 's' : ''}</strong> !
            </p>

            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              <button
                onClick={onViewMatches}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
              >
                <Heart className="w-4 h-4 fill-white/20" />
                <span>Voir mes Matchs ({matchesCount})</span>
              </button>

              <button
                onClick={onResetDeck}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser les swipes</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Bar */}
      <ActionButtons
        onRewind={onRewind}
        onDislike={() => currentOffer && onDislike(currentOffer)}
        onSuperlike={() => currentOffer && handleSuperlikeWithConfetti(currentOffer)}
        onLike={() => currentOffer && handleLikeWithConfetti(currentOffer)}
        onOpenDetails={() => currentOffer && onOpenDetails(currentOffer)}
        onDirectApply={() => currentOffer && window.open(currentOffer.applyUrl, '_blank')}
        canRewind={canRewind}
        disabled={!currentOffer}
      />
    </div>
  );
};
