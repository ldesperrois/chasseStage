import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import defaultOffersData from '../data/offers.json';
import type { InternshipOffer, MatchedOffer, ApplicationStatus, FilterState } from '../types/offer';
import { 
  getStoredSyncCode, 
  setStoredSyncCode, 
  saveToCloud, 
  loadFromCloud 
} from '../services/cloudSync';

const LOCAL_STORAGE_MATCHES_KEY = 'stagematch_saved_matches_v1';
const LOCAL_STORAGE_SWIPED_KEY = 'stagematch_swiped_ids_v1';
const LOCAL_STORAGE_OFFERS_KEY = 'stagematch_custom_offers_v1';

const defaultFilters: FilterState = {
  countries: [],
  domains: [],
  organizationTypes: [],
  minWeeks: 10, // ENSTA requirement minimum 10 weeks
  searchQuery: '',
  enstaOnly: false,
  minSalaryOnly: false,
};

export function useOffers() {
  const [syncCode, setSyncCode] = useState<string>(() => getStoredSyncCode());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'idle'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const isInitialCloudLoadDone = useRef(false);

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

  // Sync matches to localStorage (offline backup)
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MATCHES_KEY, JSON.stringify(matches));
  }, [matches]);

  // Sync swiped ids to localStorage (offline backup)
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SWIPED_KEY, JSON.stringify(swipedIds));
  }, [swipedIds]);

  // 1. Initial Cloud Pull on mount
  useEffect(() => {
    let isMounted = true;
    loadFromCloud(syncCode).then((res) => {
      if (!isMounted) return;
      if (res.success && res.data) {
        if (res.data.matches && Array.isArray(res.data.matches)) {
          // Merge local & remote matches to ensure no data is lost
          setMatches((localPrev) => {
            const remoteMap = new Map<string, MatchedOffer>();
            localPrev.forEach((m) => remoteMap.set(m.offer.id, m));
            res.data!.matches.forEach((m) => remoteMap.set(m.offer.id, m));
            return Array.from(remoteMap.values());
          });
        }
        if (res.data.swipedIds && Array.isArray(res.data.swipedIds)) {
          setSwipedIds((prev) => Array.from(new Set([...prev, ...res.data!.swipedIds])));
        }
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      }
      isInitialCloudLoadDone.current = true;
    });

    return () => {
      isMounted = false;
    };
  }, [syncCode]);

  // 2. Debounced Push to Cloud when matches or swipes change
  useEffect(() => {
    if (!isInitialCloudLoadDone.current && matches.length === 0 && swipedIds.length === 0) {
      return;
    }

    setSyncStatus('syncing');
    const timer = setTimeout(() => {
      saveToCloud(syncCode, matches, swipedIds)
        .then((res) => {
          if (res.success) {
            setSyncStatus('synced');
            setLastSyncTime(new Date());
          } else {
            setSyncStatus('error');
          }
        })
        .catch(() => setSyncStatus('error'));
    }, 1200);

    return () => clearTimeout(timer);
  }, [matches, swipedIds, syncCode]);


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

      // Filter by organization type (Entreprise vs Université / Labo)
      if (
        filters.organizationTypes.length > 0 &&
        offer.organizationType &&
        !filters.organizationTypes.includes(offer.organizationType)
      ) {
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
        const matchesLab = (offer.labName || '').toLowerCase().includes(query);
        const matchesLocation = offer.location.toLowerCase().includes(query);
        const matchesTags = offer.tags.some((tag) => tag.toLowerCase().includes(query));
        const matchesDesc = offer.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany && !matchesLab && !matchesLocation && !matchesTags && !matchesDesc) {
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

  const updateSyncCode = useCallback(async (newCode: string): Promise<boolean> => {

    const sanitized = setStoredSyncCode(newCode);
    setSyncCode(sanitized);
    setSyncStatus('syncing');

    const res = await loadFromCloud(sanitized);
    if (res.success && res.data) {
      if (res.data.matches && Array.isArray(res.data.matches)) {
        setMatches(res.data.matches);
      }
      if (res.data.swipedIds && Array.isArray(res.data.swipedIds)) {
        setSwipedIds(res.data.swipedIds);
      }
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      return true;
    } else {
      // Create fresh bucket on cloud for this code with current matches
      await saveToCloud(sanitized, matches, swipedIds);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      return true;
    }
  }, [matches, swipedIds]);

  const forceSync = useCallback(async () => {
    setSyncStatus('syncing');
    const res = await saveToCloud(syncCode, matches, swipedIds);
    if (res.success) {
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } else {
      setSyncStatus('error');
    }
  }, [syncCode, matches, swipedIds]);

  const importBackup = useCallback((newMatches: MatchedOffer[]) => {
    setMatches(newMatches);
    saveToCloud(syncCode, newMatches, swipedIds);
  }, [syncCode, swipedIds]);

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
    // Cloud Sync
    syncCode,
    syncStatus,
    lastSyncTime,
    updateSyncCode,
    forceSync,
    importBackup,
  };
}

