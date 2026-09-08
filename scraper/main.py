#!/usr/bin/env python3
"""
Pipeline Principal de Scraping StageMatch
Exécute la collecte avec anti-détection, normalise les données pour l'ENSTA Bretagne
sur l'ensemble des pays du monde (Europe, Asie-Pacifique, Amériques, Moyen-Orient, Remote)
et met à jour automatiquement src/data/offers.json et public/data/offers.json.
"""

import os
import sys
import json
import logging
from pathlib import Path
from collections import Counter

# Ajouter la racine du projet au PYTHONPATH
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from scraper.anti_detect import StealthClient
from scraper.normalizer import normalize_offer
from scraper.sources import JobSourcesAggregator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("scraper_main")

def main():
    print("=" * 70)
    print("🚀 Démarrage du Scrappeur Mondial StageMatch - ENSTA Bretagne")
    print("   Périmètre : Monde Entier (Hubs Anglophones & Internationaux)")
    print("   Filtre : Embarqué, C/C++, Robotique & Logiciel | 10+ sem. | Mai-Août")
    print("=" * 70)

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
            logger.info(f"Catalogue de référence existant : {len(existing_offers)} offres.")
        except Exception as e:
            logger.warning(f"Impossible de lire le catalogue existant: {e}")

    # 2. Collecter les nouvelles offres depuis les 8 flux mondiaux
    logger.info("Extraction en cours sur les flux mondiaux avec protection anti-bot...")
    raw_offers = aggregator.fetch_all()
    logger.info(f"Total brut d'offres récupérées sur le web : {len(raw_offers)}")

    # 3. Normaliser et filtrer selon critères ENSTA
    new_valid_offers = []
    for raw in raw_offers:
        normalized = normalize_offer(raw)
        if normalized:
            new_valid_offers.append(normalized)

    logger.info(f"Offres conformes ENSTA Bretagne après validation : {len(new_valid_offers)}")

    # 4. Fusionner et dédupliquer (par ID et par couple entreprise + titre)
    seen_ids = set()
    seen_pairs = set()
    combined_offers = []

    def make_pair(o):
        return f"{o.get('company', '').lower().strip()}-{o.get('title', '').lower().strip()}"

    # Filtrer les offres existantes pour ne conserver QUE les liens profonds directs
    from scraper.normalizer import is_direct_job_url, detect_country
    for off in existing_offers:
        if not is_direct_job_url(off.get("applyUrl", "")):
            continue
        pair = make_pair(off)
        if off["id"] not in seen_ids and pair not in seen_pairs:
            seen_ids.add(off["id"])
            seen_pairs.add(pair)
            combined_offers.append(off)

    for off in new_valid_offers:
        pair = make_pair(off)
        if off["id"] not in seen_ids and pair not in seen_pairs:
            seen_ids.add(off["id"])
            seen_pairs.add(pair)
            combined_offers.append(off)

    # Re-détection de pays pour homogénéiser les drapeaux et noms
    for off in combined_offers:
        c_info = detect_country(off.get("location", ""))
        off["country"] = c_info["name"]
        off["countryCode"] = c_info["code"]
        off["countryFlag"] = c_info["flag"]
        off["region"] = c_info.get("region", "International")

    # Priorité absolue aux offres HORS-USA (Océanie dont NZ & Australie en premier, puis Europe, Canada, Asie)
    def sort_key(o):
        is_us = o.get("countryCode") == "US" or o.get("country") == "États-Unis"
        is_oceania = o.get("countryCode") in ["NZ", "AU"] or o.get("region") == "Océanie"
        score = o.get("enstaFit", {}).get("score", 85)
        # Groupe 0 = Océanie (Nouvelle-Zélande & Australie)
        # Groupe 1 = Europe, Canada, Asie, Remote
        # Groupe 2 = États-Unis
        priority_group = 2 if is_us else (0 if is_oceania else 1)
        return (priority_group, -score)

    combined_offers.sort(key=sort_key)

    # 5. Statistiques de répartition
    countries_counter = Counter(o.get("country", "Autre") for o in combined_offers)
    domains_counter = Counter(o.get("domainLabel", "Autre") for o in combined_offers)
    org_counter = Counter(o.get("organizationType", "company") for o in combined_offers)

    # 6. Sauvegarder dans src/data et public/data
    data_file_src.parent.mkdir(parents=True, exist_ok=True)
    data_file_pub.parent.mkdir(parents=True, exist_ok=True)

    # Limiter le catalogue public à 2000 offres ultra-qualifiées pour une fluidité 60 FPS
    target_catalog = combined_offers[:2000]
    initial_seed = combined_offers[:200]

    with open(data_file_src, "w", encoding="utf-8") as f:
        json.dump(initial_seed, f, ensure_ascii=False, indent=2)

    with open(data_file_pub, "w", encoding="utf-8") as f:
        json.dump(target_catalog, f, ensure_ascii=False, indent=2)


    print("-" * 70)
    print("✅ Scraping & Fusion terminés avec succès !")
    print(f"📦 Total d'offres uniques prêtes au swipe : {len(combined_offers)}")
    print(f"🏢 Entreprises : {org_counter.get('company', 0)} | 🎓 Universités / Labos : {org_counter.get('university', 0)}")
    print("\n🌍 Répartition par Pays (Top 10) :")
    for country, count in countries_counter.most_common(10):
        print(f"   • {country:30} : {count:4d} offres")
    print("\n⚡ Répartition par Domaine :")
    for domain, count in domains_counter.most_common():
        print(f"   • {domain:30} : {count:4d} offres")
    print("-" * 70)
    print(f"💾 Fichiers mis à jour :")
    print(f"   • {data_file_src}")
    print(f"   • {data_file_pub}")
    print("=" * 70)

if __name__ == "__main__":
    main()
