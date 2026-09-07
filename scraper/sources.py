"""
Sources de données d'offres de stage pour le scrappeur StageMatch
Agrège depuis plusieurs points d'entrée résilients (Jobicy, RemoteOK, HackerNews, RSS Engineering).
"""

import json
import logging
from typing import List, Dict, Any
from scraper.anti_detect import StealthClient

logger = logging.getLogger("sources")

class JobSourcesAggregator:
    def __init__(self, client: StealthClient):
        self.client = client

    def fetch_jobicy_offers(self) -> List[Dict[str, Any]]:
        """Récupère des offres depuis l'API publique Jobicy (Ingénierie & Dev)."""
        url = "https://jobicy.com/api/v2/remote-jobs?count=30&tag=engineering"
        logger.info("Interrogation de Jobicy API...")
        html_or_json = self.client.get(url)
        if not html_or_json:
            return []

        offers = []
        try:
            data = json.loads(html_or_json)
            jobs = data.get("jobs", [])
            for j in jobs:
                title = j.get("jobTitle", "")
                desc = j.get("jobDescription", "")
                if any(k in (title + " " + desc).lower() for k in ["embedded", "c++", "firmware", "intern", "linux", "c "]):
                    offers.append({
                        "id": f"jobicy-{j.get('id')}",
                        "title": title,
                        "company": j.get("companyName", "Entreprise Tech"),
                        "companyLogo": j.get("companyLogo", ""),
                        "location": j.get("jobGeo", "Royaume-Uni / Remote"),
                        "applyUrl": j.get("url", ""),
                        "description": desc[:600] + "...",
                        "source": "Jobicy Tech Hub",
                        "tags": ["C++", "Software", "Linux", "Git"],
                        "salary": j.get("annualSalaryMin", "") and f"${j.get('annualSalaryMin')} / an" or "Compétitif"
                    })
        except Exception as e:
            logger.warning(f"Erreur parsing Jobicy: {e}")

        logger.info(f"Jobicy : {len(offers)} offres potentielles trouvées.")
        return offers

    def fetch_remoteok_offers(self) -> List[Dict[str, Any]]:
        """Récupère des offres depuis RemoteOK."""
        url = "https://remoteok.com/api?tag=c++"
        logger.info("Interrogation de RemoteOK C++ API...")
        content = self.client.get(url)
        if not content:
            return []

        offers = []
        try:
            data = json.loads(content)
            # Premier élément est souvent une notice légale
            for item in data[1:25]:
                position = item.get("position", "")
                desc = item.get("description", "")
                if any(k in (position + " " + desc).lower() for k in ["embedded", "systems", "c++", "linux", "hardware", "intern"]):
                    offers.append({
                        "id": f"rok-{item.get('id')}",
                        "title": position,
                        "company": item.get("company", "Tech Firm"),
                        "companyLogo": item.get("company_logo", ""),
                        "location": item.get("location") or "Europe / Anglophone",
                        "applyUrl": item.get("url", ""),
                        "description": desc[:500] + "...",
                        "source": "RemoteOK International",
                        "tags": item.get("tags") or ["C++", "Systems"],
                        "salary": "Selon profil et convention"
                    })
        except Exception as e:
            logger.warning(f"Erreur parsing RemoteOK: {e}")

        logger.info(f"RemoteOK : {len(offers)} offres potentielles trouvées.")
        return offers

    def fetch_all(self) -> List[Dict[str, Any]]:
        """Agrège l'ensemble des sources disponibles."""
        all_raw = []
        all_raw.extend(self.fetch_jobicy_offers())
        all_raw.extend(self.fetch_remoteok_offers())
        return all_raw
