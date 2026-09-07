import { useState, useMemo } from 'react';
import type { 
  MatchedOffer, 
  ApplicationStatus 
} from '../types/offer';
import { 
  ExternalLink, 
  Trash2, 
  Download, 
  Search, 
  Calendar, 
  Building2, 
  Clock, 
  Banknote,
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';


interface MatchesViewProps {
  matches: MatchedOffer[];
  onUpdateStatus: (offerId: string, status: ApplicationStatus, notes?: string) => void;
  onRemoveMatch: (offerId: string) => void;
  onOpenDetails: (offer: MatchedOffer['offer']) => void;
  onBackToSwipe: () => void;
}

const statusOptions: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'to_apply', label: 'À postuler 📝', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { value: 'applied', label: 'Candidature envoyée ✉️', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  { value: 'interview', label: 'Entretien RH / Tech 🎯', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { value: 'offer', label: 'Offre reçue ! 🎉', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { value: 'rejected', label: 'Refusé ✕', color: 'bg-slate-700/50 text-slate-400 border-slate-600' },
];

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  onUpdateStatus,
  onRemoveMatch,
  onOpenDetails,
  onBackToSwipe,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedStatus !== 'all' && m.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.offer.title.toLowerCase().includes(q);
        const matchCompany = m.offer.company.toLowerCase().includes(q);
        const matchCountry = m.offer.country.toLowerCase().includes(q);
        const matchNotes = (m.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCompany && !matchCountry && !matchNotes) return false;
      }
      return true;
    });
  }, [matches, selectedStatus, searchQuery]);

  const handleExportCSV = () => {
    if (matches.length === 0) return;

    const headers = [
      'Entreprise',
      'Poste',
      'Ville',
      'Pays',
      'Durée (semaines)',
      'Période',
      'Rémunération',
      'Statut',
      'Notes personnelles',
      'Lien direct candidature',
      'Date de sauvegarde',
    ];

    const rows = matches.map((m) => [
      `"${m.offer.company.replace(/"/g, '""')}"`,
      `"${m.offer.title.replace(/"/g, '""')}"`,
      `"${m.offer.city.replace(/"/g, '""')}"`,
      `"${m.offer.country.replace(/"/g, '""')}"`,
      m.offer.durationWeeks,
      `"${m.offer.startDate} - ${m.offer.endDate}"`,
      `"${m.offer.salary.replace(/"/g, '""')}"`,
      `"${m.status}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`,
      `"${m.offer.applyUrl}"`,
      `"${m.savedAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StageMatch_Candidatures_ENSTA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEditNote = (match: MatchedOffer) => {
    setEditingNoteId(match.offer.id);
    setNoteDraft(match.notes || '');
  };

  const saveNote = (offerId: string) => {
    const currentMatch = matches.find((m) => m.offer.id === offerId);
    if (currentMatch) {
      onUpdateStatus(offerId, currentMatch.status, noteDraft);
    }
    setEditingNoteId(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Header & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Mes Matchs & Suivi
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-sm font-bold border border-indigo-500/30">
              {matches.length}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gère tes candidatures de stage à l'étranger pour l'ENSTA Bretagne
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToSwipe}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            ← Continuer à swiper
          </button>

          <button
            onClick={handleExportCSV}
            disabled={matches.length === 0}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition ${
              matches.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="my-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par entreprise, poste, pays, note..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedStatus === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tous ({matches.length})
            </button>
            {statusOptions.map((opt) => {
              const count = matches.filter((m) => m.status === opt.value).length;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedStatus === opt.value
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {opt.label.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-slate-800 bg-slate-900/40">
          <Sparkles className="w-10 h-10 text-indigo-400/50 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">
            Aucun match trouvé dans cette vue
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
            {matches.length === 0
              ? "Tu n'as pas encore sauvegardé d'offres. Reviens sur le deck et swipe à droite sur les offres qui t'intéressent !"
              : "Aucune offre ne correspond à ce filtre ou mot-clé."}
          </p>
          {matches.length === 0 && (
            <button
              onClick={onBackToSwipe}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition"
            >
              Lancer le Swipe 🔥
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((m) => {
            const currentStatus = statusOptions.find((o) => o.value === m.status) || statusOptions[0];
            const isEditingThisNote = editingNoteId === m.offer.id;

            return (
              <div
                key={m.offer.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col gap-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      {m.offer.companyLogo ? (
                        <img
                          src={m.offer.companyLogo}
                          alt={m.offer.company}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-white">{m.offer.company}</span>
                        <span className="text-lg" title={m.offer.country}>{m.offer.countryFlag}</span>
                        <span className="text-xs text-slate-400">({m.offer.country})</span>
                      </div>
                      <h4 className="text-base font-semibold text-slate-100 mt-0.5">
                        {m.offer.title}
                      </h4>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <select
                      value={m.status}
                      onChange={(e) => onUpdateStatus(m.offer.id, e.target.value as ApplicationStatus)}
                      className={`text-xs font-semibold py-1.5 px-3 rounded-xl border appearance-none cursor-pointer focus:outline-none ${currentStatus.color}`}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => onRemoveMatch(m.offer.id)}
                      title="Supprimer ce match"
                      className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Key Metrics Pills */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{m.offer.durationWeeks} semaines</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>{m.offer.startDate} - {m.offer.endDate}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-emerald-300 border border-slate-700/60 font-semibold">
                    <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{m.offer.salary}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/50 text-indigo-300 border border-indigo-800/40">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{m.offer.enstaFit.badge} ({m.offer.enstaFit.score}%)</span>
                  </span>
                </div>

                {/* Notes Section */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between mb-1 text-slate-400">
                    <span className="font-medium flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-indigo-400" />
                      <span>Note de suivi personnelle :</span>
                    </span>
                    {!isEditingThisNote && (
                      <button
                        onClick={() => startEditNote(m)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        {m.notes ? 'Modifier' : '+ Ajouter une note'}
                      </button>
                    )}
                  </div>

                  {isEditingThisNote ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <input
                        type="text"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Ex: Candidaté le 12/03 avec CV version C++, relance RH prévue le 20/03..."
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="px-2.5 py-1 rounded-md text-slate-400 hover:text-slate-200"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => saveNote(m.offer.id)}
                          className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={`italic ${m.notes ? 'text-slate-200' : 'text-slate-600'}`}>
                      {m.notes || 'Aucune note ajoutée pour le moment.'}
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-500">
                    Sauvegardé le {m.savedAt}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenDetails(m.offer)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                    >
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Fiche détaillée</span>
                    </button>

                    <a
                      href={m.offer.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition group"
                    >
                      <span>Lien direct</span>
                      <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
