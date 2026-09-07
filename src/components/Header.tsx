import { Flame, Heart, Filter, Terminal, Layers } from 'lucide-react';
import type { FilterState } from '../types/offer';


interface HeaderProps {
  activeTab: 'swipe' | 'matches';
  onTabChange: (tab: 'swipe' | 'matches') => void;
  matchesCount: number;
  onOpenFilters: () => void;
  onOpenScraper: () => void;
  filters: FilterState;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  matchesCount,
  onOpenFilters,
  onOpenScraper,
  filters,
}) => {
  const hasActiveFilters =
    filters.countries.length > 0 ||
    filters.domains.length > 0 ||
    filters.searchQuery.trim() !== '' ||
    filters.minWeeks > 10 ||
    filters.enstaOnly;

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div 
          onClick={() => onTabChange('swipe')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-rose-500 fill-rose-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                StageMatch
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                ENSTA
              </span>
            </div>
            <div className="hidden sm:block text-[11px] text-slate-400 font-medium">
              Stages Embarqués & Software à l'Étranger
            </div>
          </div>
        </div>

        {/* Center Tabs: Swipe vs Matches */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => onTabChange('swipe')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === 'swipe'
                ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Swipe</span>
          </button>

          <button
            onClick={() => onTabChange('matches')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition relative ${
              activeTab === 'matches'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${matchesCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>Matchs</span>
            {matchesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                {matchesCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Filters Button */}
          <button
            onClick={onOpenFilters}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition relative ${
              hasActiveFilters
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden md:inline">Filtres</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse absolute -top-0.5 -right-0.5 sm:static" />
            )}
          </button>

          {/* Scraper Button */}
          <button
            onClick={onOpenScraper}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Gérer le scrappeur et les données"
          >
            <Terminal className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">Scrappeur</span>
          </button>
        </div>
      </div>
    </header>
  );
};
