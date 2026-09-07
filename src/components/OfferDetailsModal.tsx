import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ExternalLink, 
  MapPin, 
  Calendar, 
  Clock, 
  Banknote, 
  CheckCircle, 
  Sparkles, 
  Building2, 
  GraduationCap, 
  Briefcase, 
  Award,
  Heart
} from 'lucide-react';
import type { InternshipOffer } from '../types/offer';


interface OfferDetailsModalProps {
  offer: InternshipOffer | null;
  onClose: () => void;
  onLike?: (offer: InternshipOffer) => void;
  isMatched?: boolean;
}

export const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({
  offer,
  onClose,
  onLike,
  isMatched = false,
}) => {
  if (!offer) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Header with Company Color Banner */}
          <div
            className="p-6 relative text-white border-b border-slate-700/60"
            style={{
              background: `linear-gradient(135deg, ${offer.companyColor || '#4f46e5'}44, #0f172a 95%)`,
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-600/50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Company & Country */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 p-1 flex items-center justify-center overflow-hidden shadow-md">
                {offer.companyLogo ? (
                  <img
                    src={offer.companyLogo}
                    alt={offer.company}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="w-7 h-7 text-indigo-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold">{offer.company}</h3>
                  <span className="text-2xl" title={offer.country}>{offer.countryFlag}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    offer.organizationType === 'university' || offer.organizationType === 'research_lab'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {offer.organizationType === 'university' || offer.organizationType === 'research_lab'
                      ? '🎓 Université / Labo'
                      : '🏢 Entreprise'}
                  </span>
                </div>
                {offer.labName && (
                  <div className="text-xs text-purple-300 font-semibold mt-0.5">
                    🔬 {offer.labName}
                  </div>
                )}
                <div className="flex items-center text-xs text-slate-400 gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{offer.city}, {offer.country}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-indigo-400 font-medium">{offer.source}</span>
                </div>
              </div>
            </div>


            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-extrabold mt-4 text-white leading-tight">
              {offer.title}
            </h2>

            {/* Badges Bar */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <Clock className="w-3.5 h-3.5" />
                {offer.durationWeeks} semaines (ENSTA Validé)
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-500/30">
                <Calendar className="w-3.5 h-3.5" />
                {offer.startDate} - {offer.endDate}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                <Banknote className="w-3.5 h-3.5" />
                {offer.salary}
              </span>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ENSTA Fit Box */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                  <GraduationCap className="w-5 h-5 text-indigo-400" />
                  <span>Compatibilité Cursus ENSTA Bretagne</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-400/40">
                  {offer.enstaFit.badge} ({offer.enstaFit.score}%)
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {offer.enstaFit.reason}
              </p>
            </div>

            {/* Tech Stack */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span>Technologies & Environnement</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {offer.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                À propos de la mission
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {offer.description}
              </p>
            </div>

            {/* Responsibilities */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Missions & Responsabilités
              </h4>
              <ul className="space-y-2">
                {offer.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Profil recherché & Prérequis
              </h4>
              <ul className="space-y-2">
                {offer.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-2" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Perks */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Avantages & Cadre de travail</span>
              </h4>
              <ul className="space-y-2">
                {offer.perks.map((perk, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Fixed Footer with Direct Apply Link */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
            {onLike && !isMatched && (
              <button
                onClick={() => {
                  onLike(offer);
                  onClose();
                }}
                className="px-4 py-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-sm flex items-center gap-2 transition"
              >
                <Heart className="w-4 h-4 fill-emerald-400/20" />
                <span>Sauvegarder</span>
              </button>
            )}

            <a
              href={offer.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition transform active:scale-98"
            >
              <span>Postuler directement sur le site officiel</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
