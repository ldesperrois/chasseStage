import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, RotateCcw, Check, Sparkles, Building2, GraduationCap } from 'lucide-react';
import type { FilterState, JobDomain, OrganizationType, InternshipOffer } from '../types/offer';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (newFilters: FilterState) => void;
  totalOffersCount: number;
  filteredCount: number;
  allOffers?: InternshipOffer[];
}

const countryList = [
  { code: 'US', name: 'États-Unis', flag: '🇺🇸', tip: 'Salaires top niveau • Visa J-1', region: 'Amériques', count: 0 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', tip: 'Ottawa / Toronto / Permis EIC', region: 'Amériques', count: 0 },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧', tip: 'Hub ARM / Cambridge / Gradcracker', region: 'Europe', count: 0 },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪', tip: 'Bosch / Siemens • R&D Anglophone', region: 'Europe', count: 0 },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱', tip: 'ASML / NXP • 100% Anglophone', region: 'Europe', count: 0 },
  { code: 'IE', name: 'Irlande', flag: '🇮🇪', tip: 'Anglophone • UE (Zéro visa requis)', region: 'Europe', count: 0 },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭', tip: 'EPFL / ETH Zurich • R&D', region: 'Europe', count: 0 },
  { code: 'AU', name: 'Australie', flag: '🇦🇺', tip: 'Sydney / Melbourne • Anglophone', region: 'Océanie', count: 0 },
  { code: 'NZ', name: 'Nouvelle-Zélande', flag: '🇳🇿', tip: 'Rocket Lab / F&P / Auckland', region: 'Océanie', count: 0 },
  { code: 'SG', name: 'Singapour', flag: '🇸🇬', tip: 'Hub Asie R&D Anglophone', region: 'Asie', count: 0 },
  { code: 'REMOTE', name: 'Remote International', flag: '🌐', tip: 'Télétravail mondial', region: 'Remote', count: 0 },
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
  allOffers,
}: FilterModalProps) => {
  const [draftFilters, setDraftFilters] = useState<FilterState>(filters);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters, isOpen]);

  const availableCountries = useMemo(() => {
    if (!allOffers || allOffers.length === 0) return countryList;
    const map = new Map<string, { code: string; name: string; flag: string; count: number; region: string }>();
    
    for (const o of allOffers) {
      const code = o.countryCode || 'INT';
      const name = o.country || 'International';
      const flag = o.countryFlag || '🌍';
      const region = o.region || 'International';
      const existing = map.get(code);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(code, { code, name, flag, count: 1, region });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [allOffers]);

  const displayedCountries = useMemo(() => {
    if (selectedRegion === 'all') return availableCountries;
    return availableCountries.filter((c) => c.region === selectedRegion);
  }, [availableCountries, selectedRegion]);



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

  const toggleOrgType = (orgType: OrganizationType) => {
    setDraftFilters((prev) => {
      const exists = prev.organizationTypes.includes(orgType);
      return {
        ...prev,
        organizationTypes: exists
          ? prev.organizationTypes.filter((t) => t !== orgType)
          : [...prev.organizationTypes, orgType],
      };
    });
  };

  const resetFilters = () => {
    setDraftFilters({
      countries: [],
      domains: [],
      organizationTypes: [],
      minWeeks: 10,
      searchQuery: '',
      enstaOnly: false,
      minSalaryOnly: false,
      excludeUSA: false,
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

            {/* Exclude USA Fast Toggle */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🚫🇺🇸</span>
                <div>
                  <div className="text-xs font-bold text-white">
                    Exclure les États-Unis
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Afficher uniquement Europe, Océanie (NZ, Australie), Canada et Asie
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDraftFilters({ ...draftFilters, excludeUSA: !draftFilters.excludeUSA })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  draftFilters.excludeUSA ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    draftFilters.excludeUSA ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Organization Type: Entreprises vs Universités */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Type de structure
                </label>
                {draftFilters.organizationTypes.length > 0 && (
                  <button
                    onClick={() => setDraftFilters({ ...draftFilters, organizationTypes: [] })}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    Voir tout
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleOrgType('company')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    draftFilters.organizationTypes.includes('company')
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Entreprises Privées</div>
                      <div className="text-[10px] text-slate-400">ARM, ASML, McLaren, Garmin...</div>
                    </div>
                  </div>
                  {draftFilters.organizationTypes.includes('company') && (
                    <Check className="w-4 h-4 text-indigo-400" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => toggleOrgType('university')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                    draftFilters.organizationTypes.includes('university')
                      ? 'bg-purple-600/20 border-purple-500/60 text-white'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Universités & Labos</div>
                      <div className="text-[10px] text-purple-300/80">Cambridge, Oxford, Imperial, CMU...</div>
                    </div>
                  </div>
                  {draftFilters.organizationTypes.includes('university') && (
                    <Check className="w-4 h-4 text-purple-400" />
                  )}
                </button>
              </div>
            </div>


            {/* Countries */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pays & Hubs Mondiaux ({displayedCountries.length})
                </label>
                {draftFilters.countries.length > 0 && (
                  <button
                    onClick={() => setDraftFilters({ ...draftFilters, countries: [] })}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Effacer sélection ({draftFilters.countries.length})
                  </button>
                )}
              </div>

              {/* Region Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none text-xs">
                {[
                  { id: 'all', label: '🌍 Tous' },
                  { id: 'Amériques', label: '🇺🇸 Amériques' },
                  { id: 'Europe', label: '🇪🇺 Europe' },
                  { id: 'Océanie', label: '🇦🇺 Océanie' },
                  { id: 'Asie', label: '🌏 Asie' },
                  { id: 'Remote', label: '🌐 Remote' },
                ].map((reg) => (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => setSelectedRegion(reg.id)}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition text-[11px] font-semibold ${
                      selectedRegion === reg.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {reg.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {displayedCountries.map((c) => {
                  const isSelected = draftFilters.countries.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      onClick={() => toggleCountry(c.code)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-sm'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{c.flag}</span>
                        <div>
                          <div className="text-xs font-semibold">{c.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {c.count > 0 ? `${c.count} offres disponibles` : ('tip' in c ? (c as any).tip : '')}
                          </div>
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
