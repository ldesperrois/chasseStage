import { useState, useEffect, useMemo, useCallback } from 'react';
import defaultOffersData from '../data/offers.json';
import type { InternshipOffer, MatchedOffer, ApplicationStatus, FilterState } from '../types/offer';



const LOCAL_STORAGE_MATCHES_KEY = 'stagematch_saved_matches_v1';
const LOCAL_STORAGE_SWIPED_KEY = 'stagematch_swiped_ids_v1';
const LOCAL_STORAGE_OFFERS_KEY = 'stagematch_custom_offers_v1';

const defaultFilters: FilterState = {
  countries: [],
  domains: [],
  minWeeks: 10, // ENSTA requirement minimum 10 weeks
  searchQuery: '',
  enstaOnly: false,
  minSalaryOnly: false,
};

export function useOffers() {
  const [allOffers, setAllOffers] = useState<InternshipOffer[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_OFFERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return defaultOffersData as InternshipOffer[];
  });

  const [matches, setMatches] = useState<MatchedOffer[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MATCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [swipedIds, setSwipedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SWIPED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [swipeHistory, setSwipeHistory] = useState<{ id: string; action: 'like' | 'dislike' | 'superlike' }[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [activeOfferForModal, setActiveOfferForModal] = useState<InternshipOffer | null>(null);

  // Sync matches to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MATCHES_KEY, JSON.stringify(matches));
  }, [matches]);

  // Sync swiped ids to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SWIPED_KEY, JSON.stringify(swipedIds));
  }, [swipedIds]);

  // Filter available offers for deck
  const filteredOffers = useMemo(() => {
    return allOffers.filter((offer) => {
      // Check if already swiped
      if (swipedIds.includes(offer.id)) return false;

      // Filter by duration >= minWeeks (ENSTA >= 10 weeks)
      if (offer.durationWeeks < filters.minWeeks) return false;

      // Filter by country if selected
      if (filters.countries.length > 0 && !filters.countries.includes(offer.countryCode)) {
        return false;
      }

      // Filter by domain if selected
      if (filters.domains.length > 0 && !filters.domains.includes(offer.domain)) {
        return false;
      }

      // ENSTA only filter
      if (filters.enstaOnly && !offer.isEnstaCompliant) {
        return false;
      }

      // Free text search
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = offer.title.toLowerCase().includes(query);
        const matchesCompany = offer.company.toLowerCase().includes(query);
        const matchesLocation = offer.location.toLowerCase().includes(query);
        const matchesTags = offer.tags.some((tag) => tag.toLowerCase().includes(query));
        const matchesDesc = offer.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesTags && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [allOffers, swipedIds, filters]);

  // Current top card
  const currentOffer = filteredOffers.length > 0 ? filteredOffers[0] : null;

  // Actions
  const handleLike = useCallback((offer: InternshipOffer) => {
    setSwipedIds((prev) => [...prev, offer.id]);
    setSwipeHistory((prev) => [...prev, { id: offer.id, action: 'like' }]);

    setMatches((prev) => {
      if (prev.some((m) => m.offer.id === offer.id)) return prev;
      const newMatch: MatchedOffer = {
        offer,
        status: 'to_apply',
        savedAt: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        notes: '',
      };
      return [newMatch, ...prev];
    });
  }, []);

  const handleSuperlike = useCallback((offer: InternshipOffer) => {
    setSwipedIds((prev) => [...prev, offer.id]);
    setSwipeHistory((prev) => [...prev, { id: offer.id, action: 'superlike' }]);

    setMatches((prev) => {
      if (prev.some((m) => m.offer.id === offer.id)) return prev;
      const newMatch: MatchedOffer = {
        offer,
        status: 'to_apply',
        savedAt: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        notes: '⭐ Coup de coeur / Priorité maximale !',
        rating: 5,
      };
      return [newMatch, ...prev];
    });
  }, []);

  const handleDislike = useCallback((offer: InternshipOffer) => {
    setSwipedIds((prev) => [...prev, offer.id]);
    setSwipeHistory((prev) => [...prev, { id: offer.id, action: 'dislike' }]);
  }, []);

  const handleRewind = useCallback(() => {
    if (swipeHistory.length === 0) return;
    const last = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));
    setSwipedIds((prev) => prev.filter((id) => id !== last.id));

    // If it was a like or superlike, remove from matches
    if (last.action === 'like' || last.action === 'superlike') {
      setMatches((prev) => prev.filter((m) => m.offer.id !== last.id));
    }
  }, [swipeHistory]);

  const handleResetDeck = useCallback(() => {
    setSwipedIds([]);
    setSwipeHistory([]);
  }, []);

  const updateMatchStatus = useCallback((offerId: string, status: ApplicationStatus, notes?: string) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.offer.id === offerId) {
          return {
            ...m,
            status,
            notes: notes !== undefined ? notes : m.notes,
          };
        }
        return m;
      })
    );
  }, []);

  const removeMatch = useCallback((offerId: string) => {
    setMatches((prev) => prev.filter((m) => m.offer.id !== offerId));
  }, []);

  const importCustomOffers = useCallback((newOffers: InternshipOffer[]) => {
    if (!Array.isArray(newOffers) || newOffers.length === 0) return false;
    setAllOffers(newOffers);
    localStorage.setItem(LOCAL_STORAGE_OFFERS_KEY, JSON.stringify(newOffers));
    return true;
  }, []);

  const resetToDefaultOffers = useCallback(() => {
    setAllOffers(defaultOffersData as InternshipOffer[]);
    localStorage.removeItem(LOCAL_STORAGE_OFFERS_KEY);
  }, []);

  return {
    allOffers,
    filteredOffers,
    currentOffer,
    matches,
    filters,
    setFilters,
    canRewind: swipeHistory.length > 0,
    swipedCount: swipedIds.length,
    totalCount: allOffers.length,
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
  };
}
