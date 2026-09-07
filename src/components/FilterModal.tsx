import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, RotateCcw, Check, Sparkles } from 'lucide-react';
import type { FilterState, JobDomain } from '../types/offer';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
  totalOffersCount: number;
  filteredCount: number;
}

const countryList = [
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', tip: 'Hub ARM / Cambridge / Gradcracker' },
  { code: 'IE', name: 'Irlande', flag: '🇮🇪', tip: 'Anglophone • UE (Zéro visa requis)' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸', tip: 'Salaires top niveau • Visa J-1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', tip: 'Ottawa / Toronto / Permis EIC' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱', tip: 'ASML / NXP • 100% Anglophone' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪', tip: 'Bosch / Siemens • R&D Anglophone' },
  { code: 'NO', name: 'Norvège / Nordics', flag: '🇳🇴', tip: 'Nordic Semi • Zephyr RTOS' },
];

const domainList: { id: JobDomain; label: string; icon: string }[] = [
  { id: 'embedded', label: 'Systèmes Embarqués (C/C++)', icon: '⚡' },
  { id: 'firmware', label: 'Firmware & Microcontrôleurs', icon: '🎛️' },
  { id: 'software', label: 'C++ Temps Réel & Logiciel', icon: '💻' },
  { id: 'robotics', label: 'Robotique & ROS2', icon: '🤖' },
  { id: 'iot', label: 'IoT & Protocoles Sans Fil', icon: '📶' },
];

export const FilterModal = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  totalOffersCount,
  filteredCount,
}: FilterModalProps) => {
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters, isOpen]);


  if (!isOpen) return null;

  const toggleCountry = (code: string) => {
    setDraftFilters((prev) => {
      const exists = prev.countries.includes(code);
      return {
        ...prev,
        countries: exists
          ? prev.countries.filter((c) => c !== code)
          : [...prev.countries, code],
      };
    });
  };

  const toggleDomain = (domain: JobDomain) => {
    setDraftFilters((prev) => {
      const exists = prev.domains.includes(domain);
      return {
        ...prev,
        domains: exists
          ? prev.domains.filter((d) => d !== domain)
          : [...prev.domains, domain],
      };
    });
  };

  const resetFilters = () => {
    setDraftFilters({
      countries: [],
      domains: [],
      minWeeks: 10,
      searchQuery: '',
      enstaOnly: false,
      minSalaryOnly: false,
    });
  };

  const handleSave = () => {
    onApplyFilters(draftFilters);
    onClose();
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
          className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 z-10 flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Filtres de Recherche</h3>
                <p className="text-xs text-slate-400">
                  Affinez les offres selon vos critères ENSTA Bretagne ({filteredCount} sur {totalOffersCount} offres)
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

          {/* Scrollable Filters */}
          <div className="flex-1 overflow-y-auto py-5 space-y-6">
            {/* Search Input */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Mot-clé / Technologie
              </label>
              <input
                type="text"
                value={draftFilters.searchQuery}
                onChange={(e) => setDraftFilters({ ...draftFilters, searchQuery: e.target.value })}
                placeholder="Ex: C++, STM32, Linux, FreeRTOS, CAN, ARM..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Countries */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Pays anglophones & Hubs R&D internationaux
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {countryList.map((c) => {
                  const isSelected = draftFilters.countries.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      onClick={() => toggleCountry(c.code)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{c.flag}</span>
                        <div>
                          <div className="text-xs font-semibold">{c.name}</div>
                          <div className="text-[10px] text-slate-400">{c.tip}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Domains */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Domaines technologiques
              </label>
              <div className="flex flex-wrap gap-2">
                {domainList.map((d) => {
                  const isSelected = draftFilters.domains.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggleDomain(d.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700/70 hover:bg-slate-700/60'
                      }`}
                    >
                      <span>{d.icon}</span>
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimum duration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Durée minimale (Règle ENSTA : min. 10 semaines)
                </label>
                <span className="text-xs font-bold text-emerald-400">
                  {draftFilters.minWeeks} semaines
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[10, 12, 14, 16].map((weeks) => (
                  <button
                    key={weeks}
                    onClick={() => setDraftFilters({ ...draftFilters, minWeeks: weeks })}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                      draftFilters.minWeeks === weeks
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {weeks} sem. {weeks === 10 && '✨'}
                  </button>
                ))}
              </div>
            </div>

            {/* ENSTA Only toggle */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">
                    Période Mai - Fin Août garantie
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Masquer toute offre qui ne couvre pas le créneau requis de 10 semaines minimum
                  </div>
                </div>
              </div>

              <input
                type="checkbox"
                checked={draftFilters.enstaOnly}
                onChange={(e) => setDraftFilters({ ...draftFilters, enstaOnly: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-800 border-slate-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>

            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition"
            >
              Appliquer les filtres
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
