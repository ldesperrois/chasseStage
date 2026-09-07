import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  Banknote,
  Cpu
} from 'lucide-react';
import type { InternshipOffer } from '../types/offer';


interface SwipeCardProps {
  offer: InternshipOffer;
  isFront: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onSwipeUp: () => void;
  onOpenDetails: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  offer,
  isFront,
  onSwipeRight,
  onSwipeLeft,
  onOpenDetails,
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacityLike = useTransform(x, [20, 100], [0, 1]);
  const opacityNope = useTransform(x, [-100, -20], [1, 0]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number } }) => {
    const swipeThreshold = 100;
    const velocityThreshold = 400;

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      onSwipeRight();
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      onSwipeLeft();
    }
  };

  return (
    <motion.div
      style={{
        x: isFront ? x : 0,
        rotate: isFront ? rotate : 0,
        zIndex: isFront ? 20 : 10,
      }}
      drag={isFront ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={isFront ? handleDragEnd : undefined}
      animate={isFront ? { scale: 1, y: 0 } : { scale: 0.95, y: 14 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex flex-col cursor-grab active:cursor-grabbing select-none ${
        !isFront ? 'pointer-events-none' : ''
      }`}
    >
      {/* Swipe Stamps Overlays */}
      {isFront && (
        <>
          <motion.div
            style={{ opacity: opacityLike }}
            className="absolute top-8 left-8 z-30 pointer-events-none border-4 border-emerald-400 text-emerald-400 font-extrabold text-3xl px-4 py-1.5 rounded-xl uppercase tracking-widest rotate-[-15deg] shadow-lg bg-slate-950/40 backdrop-blur-xs"
          >
            MATCH ! 💚
          </motion.div>
          <motion.div
            style={{ opacity: opacityNope }}
            className="absolute top-8 right-8 z-30 pointer-events-none border-4 border-rose-500 text-rose-500 font-extrabold text-3xl px-4 py-1.5 rounded-xl uppercase tracking-widest rotate-[15deg] shadow-lg bg-slate-950/40 backdrop-blur-xs"
          >
            PASSER ✕
          </motion.div>
        </>
      )}

      {/* Header Banner with Company Color / Gradient */}
      <div 
        className="relative h-28 sm:h-32 px-5 pt-4 pb-2 flex items-start justify-between"
        style={{
          background: `linear-gradient(135deg, ${offer.companyColor || '#3b82f6'}33, #0f172a 90%)`,
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 p-1 flex items-center justify-center shadow-md overflow-hidden">
            {offer.companyLogo ? (
              <img 
                src={offer.companyLogo} 
                alt={offer.company} 
                className="w-full h-full object-cover rounded-xl"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Cpu className="w-6 h-6 text-indigo-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">{offer.company}</span>
              <span className="text-xl" title={offer.country}>{offer.countryFlag}</span>
            </div>
            <div className="flex items-center text-xs text-slate-400 gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{offer.city}, {offer.country}</span>
            </div>
          </div>
        </div>

        {/* ENSTA Badge */}
        <div className="flex flex-col items-end">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>{offer.enstaFit.score}% ENSTA Match</span>
          </span>
          <span className="text-[10px] text-slate-400 mt-1">{offer.source}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 px-5 py-3 flex flex-col justify-between overflow-y-auto no-scrollbar">
        {/* Role Title & Domain */}
        <div>
          <div className="inline-block text-[11px] font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            {offer.domainLabel}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            {offer.title}
          </h2>
        </div>

        {/* Quick Highlights Metrics */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="text-xs">
              <div className="text-slate-400 text-[10px]">Période (Mai-Août)</div>
              <div className="font-medium text-slate-200">{offer.startDate} - {offer.endDate}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs">
              <div className="text-slate-400 text-[10px]">Durée (Min 10 sem.)</div>
              <div className="font-semibold text-emerald-400 flex items-center gap-1">
                {offer.durationWeeks} semaines
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 col-span-2">
            <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs flex items-center justify-between w-full">
              <span className="text-slate-400 text-[10px]">Indemnité / Salaire :</span>
              <span className="font-bold text-emerald-300">{offer.salary}</span>
            </div>
          </div>
        </div>

        {/* Tech Stack Pills */}
        <div className="my-2">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
            <span>Technologies & Outils :</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {offer.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-mono font-medium border border-slate-700/80 shadow-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ENSTA Rationale Banner */}
        <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 my-1">
          <div className="font-semibold text-indigo-300 flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Pourquoi ce stage correspond à ton profil ENSTA :</span>
          </div>
          <p className="mt-1 text-slate-300 leading-relaxed text-[11px]">
            {offer.enstaFit.reason}
          </p>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-2 pb-1 flex items-center justify-between gap-2 border-t border-slate-800/80 mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Voir la fiche complète</span>
          </button>

          <a
            href={offer.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition group"
          >
            <span>Lien direct offre</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};
