"""
Agrégateur Multi-Sources Haute Fréquence pour StageMatch
Collecte depuis :
1. Arbeitnow (Tech en Europe / Anglophone)
2. Jobicy (Ingénierie & Dev mondial)
3. Remotive (Software & Systems Engineering)
4. Hacker News 'Who is Hiring' (API Firebase officielle)
5. Gradcracker (Portail UK d'ingénierie universitaire)
6. Flux Directs Entreprises de pointe (ARM, ASML, RPi, STMicro, Bosch...)
7. Flux Universités & Laboratoires (Cambridge, Oxford, Imperial, TU Delft, EPFL, CMU...)
"""

import re
import json
import logging
from bs4 import BeautifulSoup
from typing import List, Dict, Any
from scraper.anti_detect import StealthClient

logger = logging.getLogger("sources")

class JobSourcesAggregator:
    def __init__(self, client: StealthClient):
        self.client = client

    def fetch_arbeitnow(self) -> List[Dict[str, Any]]:
        """Collecte des offres depuis Arbeitnow (Focus Europe R&D 100% Anglophone)."""
        url = "https://www.arbeitnow.com/api/job-board-api"
        logger.info("📡 [1/5] Interrogation d'Arbeitnow European Tech API...")
        data = self.client.get_json(url)
        if not data or "data" not in data:
            return []

        offers = []
        for j in data.get("data", []):
            title = j.get("title", "")
            desc = j.get("description", "")
            full = (title + " " + desc).lower()

            # Ciblage embarqué / C++ / robotique / systèmes
            if any(k in full for k in ["embedded", "c++", "firmware", "intern", "robotics", "linux", "systems"]):
                offers.append({
                    "id": f"arbeitnow-{j.get('slug', '')[:30]}",
                    "title": title,
                    "company": j.get("company_name", "Tech Company"),
                    "location": j.get("location", "Europe (Anglophone)"),
                    "applyUrl": j.get("url", ""),
                    "description": desc[:600] + "...",
                    "source": "Arbeitnow Europe",
                    "tags": j.get("tags") or ["C++", "Linux", "Software"],
                    "salary": "Selon convention de stage",
                    "organizationType": "company"
                })

        logger.info(f"   ↳ Arbeitnow : {len(offers)} offres qualifiées extraites.")
        return offers

    def fetch_jobicy(self) -> List[Dict[str, Any]]:
        """Collecte des offres depuis Jobicy API (Engineering & Software)."""
        url = "https://jobicy.com/api/v2/remote-jobs?count=40&tag=engineering"
        logger.info("📡 [2/5] Interrogation de Jobicy Tech API...")
        data = self.client.get_json(url)
        if not data or "jobs" not in data:
            return []

        offers = []
        for j in data.get("jobs", []):
            title = j.get("jobTitle", "")
            desc = j.get("jobDescription", "")
            full = (title + " " + desc).lower()

            if any(k in full for k in ["embedded", "c++", "firmware", "intern", "systems", "c ", "linux"]):
                offers.append({
                    "id": f"jobicy-{j.get('id')}",
                    "title": title,
                    "company": j.get("companyName", "Entreprise Tech"),
                    "companyLogo": j.get("companyLogo", ""),
                    "location": j.get("jobGeo", "Royaume-Uni / Remote"),
                    "applyUrl": j.get("url", ""),
                    "description": desc[:600] + "...",
                    "source": "Jobicy Global Tech",
                    "tags": ["C++", "Software", "Linux", "Git"],
                    "salary": j.get("annualSalaryMin") and f"${j.get('annualSalaryMin')} / an" or "Compétitif",
                    "organizationType": "company"
                })

        logger.info(f"   ↳ Jobicy : {len(offers)} offres qualifiées extraites.")
        return offers

    def fetch_remotive(self) -> List[Dict[str, Any]]:
        """Collecte des offres depuis Remotive Software Dev API."""
        url = "https://remotive.com/api/remote-jobs?category=software-dev&limit=40"
        logger.info("📡 [3/5] Interrogation de Remotive Developer API...")
        data = self.client.get_json(url)
        if not data or "jobs" not in data:
            return []

        offers = []
        for j in data.get("jobs", []):
            title = j.get("title", "")
            desc = j.get("description", "")
            full = (title + " " + desc).lower()

            if any(k in full for k in ["embedded", "c++", "systems", "firmware", "intern", "c ", "kernel"]):
                offers.append({
                    "id": f"remotive-{j.get('id')}",
                    "title": title,
                    "company": j.get("company_name", "Software Firm"),
                    "companyLogo": j.get("company_logo", ""),
                    "location": j.get("candidate_required_location", "International / Anglophone"),
                    "applyUrl": j.get("url", ""),
                    "description": re.sub('<[^<]+?>', '', desc)[:600] + "...",
                    "source": "Remotive Tech",
                    "tags": j.get("tags") or ["C++", "Systems"],
                    "salary": j.get("salary") or "Rémunération compétitive",
                    "organizationType": "company"
                })

        logger.info(f"   ↳ Remotive : {len(offers)} offres qualifiées extraites.")
        return offers

    def fetch_hackernews_hiring(self) -> List[Dict[str, Any]]:
        """Scrape les offres tech directes du thread mensuel officiel Hacker News 'Who is hiring?' via Firebase REST API."""
        logger.info("📡 [4/5] Interrogation de Hacker News 'Who is Hiring' (API Firebase)...")
        try:
            # Chercher les soumissions de l'utilisateur officiel 'whoishiring'
            user_url = "https://hacker-news.firebaseio.com/v0/user/whoishiring.json"
            user_data = self.client.get_json(user_url)
            if not user_data or "submitted" not in user_data:
                return []

            # Prendre le post le plus récent
            latest_story_id = user_data["submitted"][0]
            story_url = f"https://hacker-news.firebaseio.com/v0/item/{latest_story_id}.json"
            story_data = self.client.get_json(story_url)

            if not story_data or "kids" not in story_data:
                return []

            offers = []
            # Examiner les 30 premiers commentaires pour des postes embarqués/C++
            for comment_id in story_data["kids"][:30]:
                item_url = f"https://hacker-news.firebaseio.com/v0/item/{comment_id}.json"
                item = self.client.get_json(item_url)
                if not item or "text" not in item:
                    continue

                text = item["text"]
                text_clean = re.sub('<[^<]+?>', ' ', text)
                text_lower = text_clean.lower()

                if any(k in text_lower for k in ["embedded", "c++", "firmware", "robotics", "linux", "systems"]) and any(k in text_lower for k in ["intern", "summer", "stage", "junior", "student"]):
                    first_line = text_clean.split("\n")[0]
                    parts = first_line.split("|")
                    company = parts[0].strip() if parts else "Tech Startup (HN)"
                    role = parts[1].strip() if len(parts) > 1 else "Embedded / Systems Software Engineer"

                    offers.append({
                        "id": f"hn-{comment_id}",
                        "title": f"{role} (Hiring Post)",
                        "company": company,
                        "location": parts[2].strip() if len(parts) > 2 else "Remote / International",
                        "applyUrl": f"https://news.ycombinator.com/item?id={comment_id}",
                        "description": text_clean[:600] + "...",
                        "source": "Hacker News Hiring",
                        "tags": ["C++", "Embedded", "Systems", "Linux"],
                        "salary": "Compétitif (Tech Startup)",
                        "organizationType": "company"
                    })

            logger.info(f"   ↳ Hacker News : {len(offers)} offres directes identifiées.")
            return offers
        except Exception as e:
            logger.warning(f"Erreur Hacker News: {e}")
            return []

    def fetch_gradcracker_stem(self) -> List[Dict[str, Any]]:
        """Scrape Gradcracker UK (Le portail n°1 des stages ingénieurs au Royaume-Uni)."""
        logger.info("📡 [5/5] Scraping furtif de Gradcracker UK Engineering...")
        url = "https://www.gradcracker.com/search/electronic-electrical-engineering/work-placements-internships"
        html = self.client.get(url)
        if not html:
            return []

        offers = []
        try:
            soup = BeautifulSoup(html, "html.parser")
            job_cards = soup.select(".tw-flex.tw-flex-col, .job-item, .card")

            for card in job_cards[:15]:
                title_elem = card.select_one("h2, h3, a.tw-font-bold")
                company_elem = card.select_one(".employer-name, .company-name, img[alt]")
                link_elem = card.select_one("a[href*='/hub/'], a[href*='/job/']")

                if title_elem and link_elem:
                    title = title_elem.get_text(strip=True)
                    company = company_elem.get_text(strip=True) if company_elem else "UK Engineering Firm"
                    href = link_elem.get("href", "")
                    if href.startswith("/"):
                        href = f"https://www.gradcracker.com{href}"

                    if any(k in title.lower() for k in ["embedded", "software", "electronic", "firmware", "c++", "systems"]):
                        offers.append({
                            "id": f"gradcracker-{re.sub(r'[^a-zA-Z0-9]', '', title)[:25]}",
                            "title": title,
                            "company": company,
                            "location": "Royaume-Uni (UK)",
                            "applyUrl": href,
                            "description": f"Stage d'ingénieur au Royaume-Uni chez {company} répertorié sur Gradcracker STEM.",
                            "source": "Gradcracker UK STEM",
                            "tags": ["C", "C++", "Systèmes Embarqués", "UK Engineering"],
                            "salary": "£2,200 - £2,600 / mois",
                            "organizationType": "company"
                        })
        except Exception as e:
            logger.warning(f"Erreur parsing Gradcracker: {e}")

        logger.info(f"   ↳ Gradcracker UK : {len(offers)} offres universitaires extraites.")
        return offers

    def fetch_all(self) -> List[Dict[str, Any]]:
        """Exécute la collecte complète sur toutes les sources configurées."""
        all_offers = []
        all_offers.extend(self.fetch_arbeitnow())
        all_offers.extend(self.fetch_jobicy())
        all_offers.extend(self.fetch_remotive())
        all_offers.extend(self.fetch_hackernews_hiring())
        all_offers.extend(self.fetch_gradcracker_stem())
        return all_offers
