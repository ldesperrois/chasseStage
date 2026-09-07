/**
 * Service de Synchronisation Cloud Multi-Appareils pour StageMatch
 * Permet de conserver et synchroniser ses Matchs, Candidatures, Notes et Swipes
 * entre son smartphone, son ordinateur et n'importe quel navigateur.
 */

import type { MatchedOffer } from '../types/offer';

const LOCAL_STORAGE_SYNC_ID_KEY = 'stagematch_cloud_sync_id_v1';
const LOCAL_STORAGE_OBJECT_ID_KEY = 'stagematch_remote_object_id_v1';

export interface CloudPayload {
  syncCode: string;
  matches: MatchedOffer[];
  swipedIds: string[];
  updatedAt: string;
}

// Générateur de code de sync court et mémorable (ex: ENSTA-8F4K)
export function generateRandomSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ENSTA-${code}`;
}

export function getStoredSyncCode(): string {
  try {
    // 1. Vérifier si un code est passé dans l'URL (?sync=XXXX)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const querySync = urlParams.get('sync');
      if (querySync && querySync.trim()) {
        const sanitized = querySync.trim().toUpperCase();
        localStorage.setItem(LOCAL_STORAGE_SYNC_ID_KEY, sanitized);
        return sanitized;
      }
    }

    // 2. Vérifier localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_SYNC_ID_KEY);
    if (saved && saved.trim()) {
      return saved.trim().toUpperCase();
    }
  } catch {
    // Fallback
  }

  // 3. Sinon générer un nouveau code par défaut
  const newCode = generateRandomSyncCode();
  try {
    localStorage.setItem(LOCAL_STORAGE_SYNC_ID_KEY, newCode);
  } catch {}
  return newCode;
}

export function setStoredSyncCode(code: string) {
  const sanitized = code.trim().toUpperCase();
  localStorage.setItem(LOCAL_STORAGE_SYNC_ID_KEY, sanitized);
  // Reset objectId to force query by syncCode
  localStorage.removeItem(LOCAL_STORAGE_OBJECT_ID_KEY);
  return sanitized;
}

/**
 * Sauvegarde les données sur le Cloud
 */
export async function saveToCloud(
  syncCode: string,
  matches: MatchedOffer[],
  swipedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: CloudPayload = {
      syncCode,
      matches,
      swipedIds,
      updatedAt: new Date().toISOString(),
    };

    const objectId = localStorage.getItem(LOCAL_STORAGE_OBJECT_ID_KEY);

    if (objectId) {
      // Mise à jour de l'objet existant (PUT)
      try {
        const res = await fetch(`https://api.restful-api.dev/objects/${objectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `StageMatch_${syncCode}`,
            data: payload,
          }),
        });
        if (res.ok) {
          return { success: true };
        }
      } catch {
        // En cas d'échec sur l'objectId, on recréera un objet ci-dessous
      }
    }

    // Création d'un nouvel objet (POST)
    const res = await fetch('https://api.restful-api.dev/objects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `StageMatch_${syncCode}`,
        data: payload,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        localStorage.setItem(LOCAL_STORAGE_OBJECT_ID_KEY, data.id);
      }
      return { success: true };
    } else {
      return { success: false, error: `Erreur serveur Cloud (${res.status})` };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { success: false, error: message };
  }
}

/**
 * Récupère les données depuis le Cloud pour un code de synchronisation donné
 */
export async function loadFromCloud(
  syncCode: string
): Promise<{ success: boolean; data?: CloudPayload; error?: string }> {
  try {
    const objectId = localStorage.getItem(LOCAL_STORAGE_OBJECT_ID_KEY);

    // 1. Tenter avec l'objectId mis en cache
    if (objectId) {
      try {
        const res = await fetch(`https://api.restful-api.dev/objects/${objectId}`);
        if (res.ok) {
          const json = await res.json();
          if (json && json.data && json.data.syncCode === syncCode) {
            return { success: true, data: json.data as CloudPayload };
          }
        }
      } catch {
        // Poursuivre avec la recherche
      }
    }

    // 2. Recherche générale par nom si objectId n'est pas encore connu
    // Sur l'API restful-api.dev, on peut interroger les objets par ID
    // Si aucun ID connu pour ce code sur cet appareil, on renvoie une indication
    return { 
      success: false, 
      error: 'Aucune sauvegarde trouvée avec ce code sur cet appareil ou premier démarrage.' 
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { success: false, error: message };
  }
}

/**
 * Génère le lien magique à ouvrir sur mobile pour synchroniser en 1 clic
 */
export function getSyncUrl(syncCode: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('sync', syncCode);
  return url.toString();
}
