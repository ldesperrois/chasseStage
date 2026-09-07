#!/usr/bin/env python3
"""
Pipeline Principal de Scraping StageMatch
Exécute la collecte avec anti-détection, normalise les données pour l'ENSTA Bretagne
et met à jour automatiquement src/data/offers.json et public/data/offers.json.
"""

import os
import sys
import json
import logging
from pathlib import Path

# Ajouter la racine du projet au PYTHONPATH
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from scraper.anti_detect import StealthClient
from scraper.normalizer import normalize_offer
from scraper.sources import JobSourcesAggregator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("scraper_main")

def main():
    print("=" * 65)
    print("🚀 Démarrage du Scrappeur StageMatch - ENSTA Bretagne")
    print("   Filtre : Systèmes Embarqués & Logiciel | 10+ sem. | Mai-Août")
    print("=" * 65)

    client = StealthClient()
    aggregator = JobSourcesAggregator(client)

    # 1. Charger les offres existantes
    data_file_src = PROJECT_ROOT / "src" / "data" / "offers.json"
    data_file_pub = PROJECT_ROOT / "public" / "data" / "offers.json"

    existing_offers = []
    if data_file_src.exists():
        try:
            with open(data_file_src, "r", encoding="utf-8") as f:
                existing_offers = json.load(f)
            logger.info(f"Catalogue existant chargé : {len(existing_offers)} offres de référence.")
        except Exception as e:
            logger.warning(f"Impossible de lire le catalogue existant: {e}")

    # 2. Collecter les nouvelles offres depuis les flux en ligne
    logger.info("Extraction en cours avec protection anti-captcha...")
    raw_offers = aggregator.fetch_all()

    # 3. Normaliser et filtrer
    new_valid_offers = []
    for raw in raw_offers:
        normalized = normalize_offer(raw)
        if normalized:
            new_valid_offers.append(normalized)

    logger.info(f"Nouvelles offres conformes ENSTA trouvées : {len(new_valid_offers)}")

    # 4. Fusionner et dédupliquer
    seen_ids = set()
    combined_offers = []

    # Priorité aux offres de référence qualifiées
    for off in existing_offers:
        if off["id"] not in seen_ids:
            seen_ids.add(off["id"])
            combined_offers.append(off)

    for off in new_valid_offers:
        if off["id"] not in seen_ids:
            seen_ids.add(off["id"])
            combined_offers.append(off)

    # 5. Sauvegarder dans src/data et public/data
    data_file_src.parent.mkdir(parents=True, exist_ok=True)
    data_file_pub.parent.mkdir(parents=True, exist_ok=True)

    with open(data_file_src, "w", encoding="utf-8") as f:
        json.dump(combined_offers, f, ensure_ascii=False, indent=2)

    with open(data_file_pub, "w", encoding="utf-8") as f:
        json.dump(combined_offers, f, ensure_ascii=False, indent=2)

    print("-" * 65)
    print(f"✅ Scraping terminé avec succès !")
    print(f"📦 Total d'offres prêtes au swipe : {len(combined_offers)}")
    print(f"💾 Fichiers mis à jour :")
    print(f"   • {data_file_src}")
    print(f"   • {data_file_pub}")
    print("=" * 65)

if __name__ == "__main__":
    main()
