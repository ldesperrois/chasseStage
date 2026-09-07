import { useState } from 'react';
import { useOffers } from './hooks/useOffers';
import { Header } from './components/Header';
import { SwipeDeck } from './components/SwipeDeck';
import { MatchesView } from './components/MatchesView';
import { OfferDetailsModal } from './components/OfferDetailsModal';
import { FilterModal } from './components/FilterModal';
import { ScraperModal } from './components/ScraperModal';
import { Sparkles, Compass, ShieldCheck } from 'lucide-react';
import type { InternshipOffer } from './types/offer';


export function App() {
  const [activeTab, setActiveTab] = useState<'swipe' | 'matches'>('swipe');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isScraperOpen, setIsScraperOpen] = useState(false);

  const {
    allOffers,
    filteredOffers,
    matches,
    filters,
    setFilters,
    canRewind,
    activeOfferForModal,
    setActiveOfferForModal,
    handleLike,
    handleSuperlike,
    handleDislike,
    handleRewind,
    handleResetDeck,
    updateMatchStatus,
    removeMatch,
    importCustomOffers,
    resetToDefaultOffers,
  } = useOffers();

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        matchesCount={matches.length}
        onOpenFilters={() => setIsFilterOpen(true)}
        onOpenScraper={() => setIsScraperOpen(true)}
        filters={filters}
      />

      {/* Target Focus Banner */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 text-[11px] sm:text-xs text-slate-300">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>
              <strong>Objectif ENSTA Bretagne :</strong> Stage International début Mai → fin Août 2026 (≥ 10 semaines)
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span className="hidden sm:inline-flex items-center gap-1">
              <Compass className="w-3 h-3 text-sky-400" />
              <span>UK, Irlande, USA, Canada, Hubs R&D</span>
            </span>
            <span className="inline-flex items-center gap-1 text-indigo-300">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Systèmes Embarqués & Logiciel</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col justify-center py-2 sm:py-4">
        {activeTab === 'swipe' ? (
          <SwipeDeck
            offers={filteredOffers}
            onLike={handleLike}
            onDislike={handleDislike}
            onSuperlike={handleSuperlike}
            onRewind={handleRewind}
            onResetDeck={handleResetDeck}
            onOpenDetails={(offer: InternshipOffer) => setActiveOfferForModal(offer)}
            onOpenFilters={() => setIsFilterOpen(true)}
            onViewMatches={() => setActiveTab('matches')}
            canRewind={canRewind}
            matchesCount={matches.length}
          />
        ) : (
          <MatchesView
            matches={matches}
            onUpdateStatus={updateMatchStatus}
            onRemoveMatch={removeMatch}
            onOpenDetails={(offer: InternshipOffer) => setActiveOfferForModal(offer)}
            onBackToSwipe={() => setActiveTab('swipe')}
          />
        )}
      </main>

      {/* Footer information */}
      <footer className="w-full border-t border-slate-900 py-3 text-center text-[11px] text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>StageMatch • Conçu pour les élèves-ingénieurs ENSTA Bretagne (FIPA Embarqué & Logiciel)</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Déploiement Netlify Prêt</span>
            </span>
            <span>•</span>
            <button
              onClick={() => setIsScraperOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 transition"
            >
              Pipeline Anti-Captcha
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <OfferDetailsModal
        offer={activeOfferForModal}
        onClose={() => setActiveOfferForModal(null)}
        onLike={handleLike}
        isMatched={matches.some((m) => m.offer.id === activeOfferForModal?.id)}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
        totalOffersCount={allOffers.length}
        filteredCount={filteredOffers.length}
      />

      <ScraperModal
        isOpen={isScraperOpen}
        onClose={() => setIsScraperOpen(false)}
        onImportOffers={importCustomOffers}
        onResetOffers={resetToDefaultOffers}
        currentOffersCount={allOffers.length}
      />
    </div>
  );
}

export default App;
