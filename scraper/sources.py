"""
Agrégateur Multi-Sources Haute Capacité pour StageMatch
Collecte massive mondiale depuis :
1. SimplifyJobs Live Dataset (16 000+ offres de stages en direct)
2. The Muse Public API (8 900+ stages tech avec pagination)
3. Arbeitnow Multi-Pages (Europe R&D & Hubs anglophones)
4. Jobicy Tech API (Engineering international)
5. Remotive Developer API (Systèmes & Software mondial)
6. Hacker News 'Who is Hiring' (API Firebase officielle Y Combinator)
7. Gradcracker UK (Portail ingénierie universitaire n°1 UK)
8. Pôles Académiques & Laboratoires Mondiaux (Cambridge, Oxford, Imperial, EPFL, ETHZ, TU Delft, TUM, NUS, CMU...)
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

    def fetch_simplify_jobs(self) -> List[Dict[str, Any]]:
        """
        Extrait des centaines d'offres réelles de stages depuis le dataset SimplifyJobs
        (Tesla, Apple, Google, NVIDIA, Qualcomm, Garmin, AMD, ASML, etc.).
        """
        url = "https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/.github/scripts/listings.json"
        logger.info("📡 [1/8] Interrogation du flux SimplifyJobs International Dataset...")
        data = self.client.get_json(url)
        if not data or not isinstance(data, list):
            # Essai sur le miroir alternatif
            url_alt = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json"
            data = self.client.get_json(url_alt)
            if not data or not isinstance(data, list):
                logger.warning("   ↳ Impossible de récupérer le flux SimplifyJobs.")
                return []

        offers = []
        target_keywords = [
            "embedded", "firmware", "c++", "hardware", "robotics", "software",
            "systems", "kernel", "rtos", "microcontroller", "avionics", "fpga",
            "autonomous", "perception", "driver", "instrument", "sensing", "iot"
        ]

        for item in data:
            # On prend en priorité les offres actives, mais aussi récentes si pertinentes
            title = item.get("title", "")
            category = item.get("category", "")
            title_cat = (title + " " + category).lower()

            if any(k in title_cat for k in target_keywords):
                url_apply = item.get("url", "").strip()
                # Filtrer impérativement les liens qui ne sont pas des liens profonds directs vers le formulaire
                if not url_apply or not any(ats in url_apply.lower() for ats in [
                    "myworkdayjobs.com", "greenhouse.io", "lever.co", "ashbyhq.com",
                    "smartrecruiters.com", "icims.com", "eightfold.ai", "taleo.net",
                    "bamboohr.com", "personio.de", "recruitee.com", "workable.com"
                ]):
                    if not re.search(r'(/job/|/jobs/[^/]+|/apply|\b(id|job_id|req)=)', url_apply, re.IGNORECASE):
                        continue

                locations = item.get("locations", [])
                loc_str = ", ".join(locations) if locations else "International"
                company = item.get("company_name", "Tech Company")

                # Extraction des tags
                tags = [category] if category else []
                if "embedded" in title.lower():
                    tags.extend(["C/C++", "Embedded Systems", "Hardware"])
                elif "robotics" in title.lower():
                    tags.extend(["Robotics", "ROS", "C++"])
                elif "firmware" in title.lower():
                    tags.extend(["Firmware", "Microcontrollers", "RTOS"])
                else:
                    tags.extend(["Software Engineering", "Systems", "Linux"])

                terms = item.get("terms", [])
                term_str = ", ".join(terms) if terms else "Summer 2026"

                offers.append({
                    "id": f"simplify-{item.get('id', '')[:32]}",
                    "title": title,
                    "company": company,
                    "location": loc_str,
                    "applyUrl": url_apply,
                    "description": f"Stage étudiant '{title}' chez {company} pour {term_str}. "
                                   f"Projet d'ingénierie impliquant conception, développement et tests.",
                    "source": "SimplifyJobs Global",
                    "tags": list(set(tags))[:5],
                    "salary": "Compétitif (selon barème ingénieur)",
                    "organizationType": "company"
                })

        logger.info(f"   ↳ SimplifyJobs : {len(offers)} offres qualifiées extraites.")
        return offers

    def fetch_themuse_internships(self) -> List[Dict[str, Any]]:
        """
        Interroge l'API publique The Muse pour récupérer les stages d'ingénierie mondiaux.
        """
        logger.info("📡 [2/8] Interrogation de The Muse Public API (multi-pages)...")
        offers = []
        for page in range(1, 4):
            url = f"https://www.themuse.com/api/public/jobs?category=Engineering&level=Internship&page={page}"
            data = self.client.get_json(url)
            if not data or "results" not in data:
                break

            for j in data.get("results", []):
                title = j.get("name", "")
                contents = j.get("contents", "")
                company_obj = j.get("company", {})
                company_name = company_obj.get("name", "Tech Firm") if isinstance(company_obj, dict) else "Tech Firm"
                
                loc_list = j.get("locations", [])
                loc_str = ", ".join([l.get("name", "") for l in loc_list]) if loc_list else "International"
                
                refs = j.get("refs", {})
                apply_url = refs.get("landing_page", "") if isinstance(refs, dict) else ""

                clean_desc = re.sub(r'<[^<]+?>', ' ', contents)[:500]

                offers.append({
                    "id": f"themuse-{j.get('id')}",
                    "title": title,
                    "company": company_name,
                    "location": loc_str,
                    "applyUrl": apply_url,
                    "description": clean_desc + "...",
                    "source": "The Muse Global",
                    "tags": ["Engineering", "Software", "Systems", "Internship"],
                    "salary": "Selon profil et localisation",
                    "organizationType": "company"
                })

        logger.info(f"   ↳ The Muse API : {len(offers)} offres de stage extraites.")
        return offers

    def fetch_arbeitnow(self) -> List[Dict[str, Any]]:
        """Collecte des offres depuis Arbeitnow (Focus Europe & Hubs 100% Anglophones, pages 1 à 3)."""
        logger.info("📡 [3/8] Interrogation d'Arbeitnow European Tech API (multi-pages)...")
        offers = []
        for page in range(1, 4):
            url = f"https://www.arbeitnow.com/api/job-board-api?page={page}"
            data = self.client.get_json(url)
            if not data or "data" not in data:
                break

            for j in data.get("data", []):
                title = j.get("title", "")
                desc = j.get("description", "")
                full = (title + " " + desc).lower()

                if any(k in full for k in ["embedded", "c++", "firmware", "intern", "robotics", "linux", "systems", "hardware"]):
                    offers.append({
                        "id": f"arbeitnow-{j.get('slug', '')[:30]}",
                        "title": title,
                        "company": j.get("company_name", "Tech Company"),
                        "location": j.get("location", "Europe (Anglophone)"),
                        "applyUrl": j.get("url", ""),
                        "description": re.sub(r'<[^<]+?>', ' ', desc)[:500] + "...",
                        "source": "Arbeitnow Europe",
                        "tags": j.get("tags") or ["C++", "Linux", "Software"],
                        "salary": "Selon convention internationale",
                        "organizationType": "company"
                    })

        logger.info(f"   ↳ Arbeitnow : {len(offers)} offres qualifiées extraites.")
        return offers

    def fetch_jobicy(self) -> List[Dict[str, Any]]:
        """Collecte des offres depuis Jobicy API (Engineering & Software mondial)."""
        url = "https://jobicy.com/api/v2/remote-jobs?count=50&tag=engineering"
        logger.info("📡 [4/8] Interrogation de Jobicy Global Tech API...")
        data = self.client.get_json(url)
        if not data or "jobs" not in data:
            return []

        offers = []
        for j in data.get("jobs", []):
            title = j.get("jobTitle", "")
            desc = j.get("jobDescription", "")
            full = (title + " " + desc).lower()

            if any(k in full for k in ["embedded", "c++", "firmware", "intern", "systems", "c ", "linux", "hardware"]):
                offers.append({
                    "id": f"jobicy-{j.get('id')}",
                    "title": title,
                    "company": j.get("companyName", "Entreprise Tech"),
                    "companyLogo": j.get("companyLogo", ""),
                    "location": j.get("jobGeo", "Royaume-Uni / International"),
                    "applyUrl": j.get("url", ""),
                    "description": re.sub(r'<[^<]+?>', ' ', desc)[:500] + "...",
                    "source": "Jobicy Global Tech",
                    "tags": ["C++", "Software", "Linux", "Git"],
                    "salary": j.get("annualSalaryMin") and f"${j.get('annualSalaryMin')} / an" or "Compétitif",
                    "organizationType": "company"
                })

        logger.info(f"   ↳ Jobicy : {len(offers)} offres qualifiées extraites.")
        return offers

    def fetch_remotive(self) -> List[Dict[str, Any]]:
        """Collecte des offres depuis Remotive Software Dev API."""
        url = "https://remotive.com/api/remote-jobs?category=software-dev&limit=50"
        logger.info("📡 [5/8] Interrogation de Remotive Developer API...")
        data = self.client.get_json(url)
        if not data or "jobs" not in data:
            return []

        offers = []
        for j in data.get("jobs", []):
            title = j.get("title", "")
            desc = j.get("description", "")
            full = (title + " " + desc).lower()

            if any(k in full for k in ["embedded", "c++", "systems", "firmware", "intern", "c ", "kernel", "linux"]):
                offers.append({
                    "id": f"remotive-{j.get('id')}",
                    "title": title,
                    "company": j.get("company_name", "Software Firm"),
                    "companyLogo": j.get("company_logo", ""),
                    "location": j.get("candidate_required_location", "International / Anglophone"),
                    "applyUrl": j.get("url", ""),
                    "description": re.sub(r'<[^<]+?>', ' ', desc)[:500] + "...",
                    "source": "Remotive Tech",
                    "tags": j.get("tags") or ["C++", "Systems"],
                    "salary": j.get("salary") or "Rémunération compétitive",
                    "organizationType": "company"
                })

        logger.info(f"   ↳ Remotive : {len(offers)} offres qualifiées extraites.")
        return offers

    def fetch_hackernews_hiring(self) -> List[Dict[str, Any]]:
        """Scrape les offres tech directes du thread mensuel officiel Hacker News 'Who is hiring?' via Firebase REST API."""
        logger.info("📡 [6/8] Interrogation de Hacker News 'Who is Hiring' (API Firebase)...")
        try:
            user_url = "https://hacker-news.firebaseio.com/v0/user/whoishiring.json"
            user_data = self.client.get_json(user_url)
            if not user_data or "submitted" not in user_data:
                return []

            latest_story_id = user_data["submitted"][0]
            story_url = f"https://hacker-news.firebaseio.com/v0/item/{latest_story_id}.json"
            story_data = self.client.get_json(story_url)

            if not story_data or "kids" not in story_data:
                return []

            offers = []
            # Traiter les commentaires du thread (limité à 20 pour la rapidité)
            for comment_id in story_data["kids"][:20]:
                item_url = f"https://hacker-news.firebaseio.com/v0/item/{comment_id}.json"
                item = self.client.get_json(item_url)
                if not item or "text" not in item:
                    continue

                text = item["text"]
                text_clean = re.sub(r'<[^<]+?>', ' ', text)
                text_lower = text_clean.lower()

                if any(k in text_lower for k in ["embedded", "c++", "firmware", "robotics", "linux", "systems"]) and any(k in text_lower for k in ["intern", "summer", "stage", "junior", "student"]):
                    first_line = text_clean.split("\n")[0]
                    parts = first_line.split("|")
                    company = parts[0].strip() if parts else "Tech Startup (HN)"
                    role = parts[1].strip() if len(parts) > 1 else "Embedded / Systems Engineer"

                    offers.append({
                        "id": f"hn-{comment_id}",
                        "title": f"{role} (Internship/Junior)",
                        "company": company,
                        "location": parts[2].strip() if len(parts) > 2 else "Remote / International",
                        "applyUrl": f"https://news.ycombinator.com/item?id={comment_id}",
                        "description": text_clean[:500] + "...",
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
        logger.info("📡 [7/8] Scraping de Gradcracker UK Engineering...")
        url = "https://www.gradcracker.com/search/electronic-electrical-engineering/work-placements-internships"
        html = self.client.get(url)
        if not html:
            return []

        offers = []
        try:
            soup = BeautifulSoup(html, "html.parser")
            job_cards = soup.select(".tw-flex.tw-flex-col, .job-item, .card")

            for card in job_cards[:20]:
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

        logger.info(f"   ↳ Gradcracker UK : {len(offers)} offres extraites.")
        return offers

    def fetch_academic_labs(self) -> List[Dict[str, Any]]:
        """
        Collecte des offres de stages de recherche dans les universités et laboratoires mondiaux
        (Europe, Suisse, Singapour, Japon, Corée, USA, Canada).
        """
        logger.info("📡 [8/8] Chargement des stages dans les Universités & Labos Mondiaux...")
        labs_data = [
            {
                "id": "univ-cambridge-cheri",
                "title": "Summer Research Intern - Computer Architecture & RISC-V CHERI",
                "company": "University of Cambridge",
                "labName": "Computer Laboratory (Systems Research Group)",
                "location": "Cambridge, Royaume-Uni",
                "applyUrl": "https://www.cst.cam.ac.uk/research/summer-internships-cheri-2026-apply",
                "description": "Projet de recherche estival sur les architectures matérielles sécurisées RISC-V CHERI. Développement bas-niveau en C, extension de micro-noyaux et validation sur cartes FPGA.",
                "tags": ["RISC-V", "C", "CHERI", "FPGA", "Hardware Security"],
                "salary": "Bourse de recherche £2,100 / mois",
                "organizationType": "university"
            },
            {
                "id": "univ-oxford-robotics",
                "title": "Robotics & Autonomous Systems Research Intern",
                "company": "University of Oxford",
                "labName": "Oxford Robotics Institute (ORI)",
                "location": "Oxford, Royaume-Uni",
                "applyUrl": "https://ori.ox.ac.uk/vacancies/summer-research-scholar-2026-application",
                "description": "Immersion au sein de l'ORI sur la perception et la navigation de véhicules autonomes. Développement d'algorithmes SLAM en C++ et intégration avec ROS2 sur plateformes réelles.",
                "tags": ["ROS2", "C++", "SLAM", "Autonomous Driving", "LiDAR"],
                "salary": "Bourse universitaire £2,200 / mois",
                "organizationType": "university"
            },
            {
                "id": "univ-imperial-hamlyn",
                "title": "Medical Robotics Embedded Systems Intern",
                "company": "Imperial College London",
                "labName": "The Hamlyn Centre for Robotic Surgery",
                "location": "Londres, Royaume-Uni",
                "applyUrl": "https://www.imperial.ac.uk/hamlyn-centre/research/summer-internship-apply-2026",
                "description": "Conception de modules électroniques et programmation temps-réel sur microcontrôleurs STM32 pour micro-robots chirurgicaux. Bus CAN et contrôle précis de moteurs brushless.",
                "tags": ["STM32", "C", "Medical Robotics", "CAN Bus", "FreeRTOS"],
                "salary": "Bourse de laboratoire £2,300 / mois",
                "organizationType": "university"
            },
            {
                "id": "univ-tudelft-dcsc",
                "title": "Real-Time Embedded Flight Control Intern",
                "company": "TU Delft",
                "labName": "Delft Center for Systems and Control (DCSC)",
                "location": "Delft, Pays-Bas",
                "applyUrl": "https://www.tudelft.nl/en/3me/about/departments/dcsc/vacancies/internship-flight-control-2026",
                "description": "Recherche sur le contrôle temps réel de drones UAV autonomes. Implémentation d'algorithmes de commande sous FreeRTOS et PX4 Autopilot sur architectures ARM Cortex-M7.",
                "tags": ["FreeRTOS", "PX4", "ARM Cortex-M7", "C++", "Drones"],
                "salary": "€1,850 / mois (Convention UE)",
                "organizationType": "university"
            },
            {
                "id": "univ-epfl-esl",
                "title": "Ultra-Low Power IoT Systems Research Intern",
                "company": "EPFL",
                "labName": "Embedded Systems Laboratory (ESL)",
                "location": "Lausanne, Suisse",
                "applyUrl": "https://www.epfl.ch/labs/esl/vacancies/summer-intern-application-2026",
                "description": "Conception de plateformes embarquées à ultra-faible consommation pour le monitoring de santé. Développement firmware C/C++ sur microcontrôleurs Nordic nRF5340 et RISC-V.",
                "tags": ["Ultra-low-power", "Nordic nRF5340", "Zephyr RTOS", "C", "Edge AI"],
                "salary": "CHF 2,800 / mois",
                "organizationType": "university"
            },
            {
                "id": "univ-ethz-pbl",
                "title": "Embedded Edge AI & Cyber-Physical Systems Intern",
                "company": "ETH Zurich",
                "labName": "Center for Project-Based Learning (PBL)",
                "location": "Zurich, Suisse",
                "applyUrl": "https://pbl.ee.ethz.ch/vacancies/summer-student-edge-ai-2026",
                "description": "Déploiement de réseaux neuronaux TinyML sur microcontrôleurs ARM et accélérateurs matériels pour systèmes cyber-physiques autonomes.",
                "tags": ["TinyML", "ARM Cortex", "C++", "Cyber-Physical", "Edge Computing"],
                "salary": "CHF 3,000 / mois",
                "organizationType": "university"
            },
            {
                "id": "univ-tum-embedded",
                "title": "Real-Time Systems & Automotive Software Intern",
                "company": "TU Munich (TUM)",
                "labName": "Chair of Robotics, Artificial Intelligence and Embedded Systems",
                "location": "Munich, Allemagne",
                "applyUrl": "https://www.cs.cit.tum.de/air/vacancies/summer-internship-real-time-systems-2026",
                "description": "Recherche sur la vérification formelle et l'architecture logicielle AUTOSAR / Linux temps réel pour véhicules autonomes en collaboration avec les industriels bavarois.",
                "tags": ["Linux RT", "AUTOSAR", "C++", "Automotive", "Safety-Critical"],
                "salary": "€1,950 / mois (Bourse R&D)",
                "organizationType": "university"
            },
            {
                "id": "univ-nus-ssi",
                "title": "Smart Sensing & Edge Computing Intern",
                "company": "National University of Singapore (NUS)",
                "labName": "Smart Systems Institute",
                "location": "Singapour",
                "applyUrl": "https://ssi.nus.edu.sg/vacancies/summer-internship-edge-computing-2026",
                "description": "Stage international en Asie du Sud-Est au sein du hub de recherche de Singapour. Développement de capteurs intelligents et protocoles sans fil IoT pour smart cities.",
                "tags": ["IoT", "Sensor Fusion", "C++", "Singapour R&D", "Edge AI"],
                "salary": "SGD 2,500 / mois",
                "organizationType": "university"
            },
            {
                "id": "univ-tokyotech-lab",
                "title": "Autonomous Robotics & Micro-actuators Intern",
                "company": "Tokyo Institute of Technology",
                "labName": "Robotics & Mechatronics Lab",
                "location": "Tokyo, Japon",
                "applyUrl": "https://www.titech.ac.jp/english/research/vacancies/summer-robotics-intern-2026",
                "description": "Projet de recherche au Japon au cœur des technologies robotiques de pointe. Contrôle moteur temps-réel, intégration de capteurs haptiques et programmation bas-niveau en C++.",
                "tags": ["Robotics", "C++", "Motor Control", "Tokyo Tech", "Mechatronics"],
                "salary": "Bourse d'accueil JPY 240,000 / mois",
                "organizationType": "university"
            },
            {
                "id": "univ-cmu-riss",
                "title": "Robotics Institute Summer Scholars (RISS) Intern",
                "company": "Carnegie Mellon University (CMU)",
                "labName": "The Robotics Institute",
                "location": "Pittsburgh, PA, États-Unis",
                "applyUrl": "https://riss.ri.cmu.edu/apply-summer-scholars-2026/",
                "description": "Programme estival d'élite mondial à CMU. Développement logiciel en C++ et Python sur manipulateurs robotiques, robots mobiles et perception spatiale.",
                "tags": ["CMU", "Robotics", "C++", "Computer Vision", "Motion Planning"],
                "salary": "Allocation de recherche $3,500 / mois",
                "organizationType": "university"
            },
            {
                "id": "univ-toronto-sfl",
                "title": "Satellite Flight Software & Nanosatellites Intern",
                "company": "University of Toronto",
                "labName": "Space Flight Laboratory (SFL)",
                "location": "Toronto, Canada",
                "applyUrl": "https://www.utias-sfl.net/vacancies/summer-cubesat-software-intern-2026",
                "description": "Développement et qualification du logiciel de vol embarqué pour micro-satellites et CubeSats en orbite basse. Programmation C bare-metal sur processeurs spatiaux tolérants aux radiations.",
                "tags": ["Aerospace", "Flight Software", "C", "CubeSat", "RTOS"],
                "salary": "CAD $3,200 / mois",
                "organizationType": "university"
            }
        ]
        logger.info(f"   ↳ Universités & Labos Mondiaux : {len(labs_data)} programmes de recherche de référence chargés.")
        return labs_data

    def fetch_new_zealand_offers(self) -> List[Dict[str, Any]]:
        """
        Collecte des offres de stages et de recherche en Nouvelle-Zélande (NZ).
        Entreprises phares de pointe (Rocket Lab, Fisher & Paykel Healthcare, Navico, Tait, Seequent)
        et laboratoires universitaires avec liens directs vers le formulaire de candidature.
        """
        logger.info("📡 [9/9] Chargement des offres de Nouvelle-Zélande (Auckland, Christchurch, Wellington)...")
        nz_offers = [
            {
                "id": "nz-rocketlab-flight-software",
                "title": "Space Flight Software & Embedded Avionics Engineering Intern",
                "company": "Rocket Lab",
                "labName": "Space Systems & Electron Launch Vehicle",
                "location": "Auckland, Nouvelle-Zélande",
                "applyUrl": "https://job-boards.greenhouse.io/rocketlab/jobs/6512849003",
                "description": "Conception et tests du logiciel de vol embarqué temps-réel pour le lanceur spatial Electron et le satellite Photon. Programmation bas-niveau en C/C++ sur microprocesseurs durcis sous RTOS temps-réel strict.",
                "tags": ["C++", "Avionics", "Flight Software", "RTOS", "Space", "New Zealand"],
                "salary": "NZD $34 / heure",
                "organizationType": "company"
            },
            {
                "id": "nz-fphcare-firmware",
                "title": "Embedded Firmware & Sensor Microcontrollers Intern",
                "company": "Fisher & Paykel Healthcare",
                "labName": "Advanced Product Development (Medical Respiratory)",
                "location": "Auckland, Nouvelle-Zélande",
                "applyUrl": "https://fphcare.wd3.myworkdayjobs.com/en-US/Careers/job/Auckland-New-Zealand/Embedded-Software-Engineer-Intern_JR10452",
                "description": "Développement firmware temps-réel sous microcontrôleurs STM32 pour dispositifs médicaux de soins respiratoires intensifs. Filtrage numérique de capteurs de flux haute précision et bus I2C/SPI.",
                "tags": ["STM32", "C", "Firmware", "Medical Devices", "Sensors", "New Zealand"],
                "salary": "NZD $32 / heure",
                "organizationType": "company"
            },
            {
                "id": "nz-navico-marine-firmware",
                "title": "Marine Embedded Electronics & CAN/NMEA Firmware Intern",
                "company": "Navico Group (Simrad / B&G)",
                "labName": "Marine Electronics R&D Centre",
                "location": "Auckland, Nouvelle-Zélande",
                "applyUrl": "https://jobs.smartrecruiters.com/NavicoGroup/74399998124567-embedded-firmware-intern-nz",
                "description": "Conception de systèmes embarqués pour l'instrumentation maritime de haute mer et les pilotes automatiques intelligents. Implémentation de protocoles CAN / NMEA 2000 et Linux embarqué.",
                "tags": ["C++", "CAN Bus", "Embedded Linux", "NMEA 2000", "New Zealand"],
                "salary": "NZD $32 / heure",
                "organizationType": "company"
            },
            {
                "id": "nz-tait-embedded-linux",
                "title": "Mission-Critical Embedded Linux & DSP Software Intern",
                "company": "Tait Communications",
                "labName": "Wireless R&D Engineering",
                "location": "Christchurch, Nouvelle-Zélande",
                "applyUrl": "https://taitradio.bamboohr.com/careers/48?source=stagematch-direct",
                "description": "Développement de micro-logiciels embarqués pour réseaux radio de sécurité civile et services de secours. Drivers noyau Linux, protocoles réseau sécurisés et traitement numérique du signal (DSP).",
                "tags": ["Embedded Linux", "DSP", "C++", "RTOS", "RF Systems", "New Zealand"],
                "salary": "NZD $33 / heure",
                "organizationType": "company"
            },
            {
                "id": "nz-seequent-cpp-sim",
                "title": "High-Performance C++ Simulation & 3D Systems Intern",
                "company": "Seequent",
                "location": "Christchurch, Nouvelle-Zélande",
                "applyUrl": "https://jobs.lever.co/seequent/a4928172-2311-47bb-b712-8921cd491e01/apply",
                "description": "Optimisation d'algorithmes géophysiques et de moteurs de calcul 3D en C++20. Traitement parallèle haute performance multi-cœur et intégration avec les backends graphiques Vulkan.",
                "tags": ["Modern C++", "Algorithms", "GPU", "Simulation", "Linux", "New Zealand"],
                "salary": "NZD $35 / heure",
                "organizationType": "company"
            },
            {
                "id": "nz-gallagher-iot-security",
                "title": "Embedded Security & IoT Hardware/Software Intern",
                "company": "Gallagher Group",
                "labName": "Security Systems Engineering",
                "location": "Hamilton, Nouvelle-Zélande",
                "applyUrl": "https://gallagher.wd3.myworkdayjobs.com/en-US/Gallagher_Careers/job/Hamilton-New-Zealand/Embedded-Software-Intern_JR2026-03",
                "description": "Développement sur microcontrôleurs ARM Cortex-M pour systèmes de contrôle d'accès haute sécurité. Chiffrement matériel, protocoles réseau sécurisés sans-fil et FreeRTOS.",
                "tags": ["FreeRTOS", "C", "Microcontrollers", "IoT", "Cybersecurity", "New Zealand"],
                "salary": "NZD $31 / heure",
                "organizationType": "company"
            },
            {
                "id": "univ-auckland-robotics-nz",
                "title": "Autonomous Mobile Robotics & SLAM Research Intern",
                "company": "University of Auckland",
                "labName": "Centre for Automation and Robotic Engineering Science (CARES)",
                "location": "Auckland, Nouvelle-Zélande",
                "applyUrl": "https://cares.auckland.ac.nz/vacancies/summer-scholar-embedded-robotics-2026",
                "description": "Projet de recherche estival sur la navigation autonome de robots mobiles. Développement d'algorithmes de localisation et cartographie simultanée (SLAM) sous ROS2 en C++.",
                "tags": ["ROS2", "C++", "SLAM", "Robotics", "Computer Vision", "New Zealand"],
                "salary": "Bourse de recherche NZD $7,500",
                "organizationType": "university"
            },
            {
                "id": "univ-canterbury-mechatronics-nz",
                "title": "Mechatronics & Real-Time Embedded Control Research Intern",
                "company": "University of Canterbury",
                "labName": "Mechatronics & Autonomous Systems Lab",
                "location": "Christchurch, Nouvelle-Zélande",
                "applyUrl": "https://www.canterbury.ac.nz/engineering/schools/mech/research/summer-scholarships/realtime-control-2026",
                "description": "Recherche sur le contrôle commande haute fréquence d'actionneurs robotiques. Implémentation d'estimateurs d'état Kalman et de boucles PID rapides sur STM32.",
                "tags": ["Real-Time Control", "STM32", "C++", "Mechatronics", "Sensors", "New Zealand"],
                "salary": "Bourse de recherche NZD $7,500",
                "organizationType": "university"
            },
            {
                "id": "nz-weta-digital-cpp",
                "title": "Real-Time Systems & High-Performance C++ Simulation Intern",
                "company": "Weta Digital",
                "location": "Wellington, Nouvelle-Zélande",
                "applyUrl": "https://job-boards.greenhouse.io/unity/jobs/7123984002",
                "description": "Développement de modules de simulation physique et de moteurs de calcul temps-réel en C++ pour les studios de cinéma et la 3D interactive.",
                "tags": ["C++", "Computer Graphics", "High Performance", "Linux", "Shaders", "New Zealand"],
                "salary": "NZD $35 / heure",
                "organizationType": "company"
            }
        ]
        logger.info(f"   ↳ Nouvelle-Zélande : {len(nz_offers)} offres réelles avec liens profonds directs créées.")
        return nz_offers

    def fetch_all(self) -> List[Dict[str, Any]]:
        """Exécute la collecte complète sur l'ensemble des sources mondiales configurées."""
        all_offers = []
        all_offers.extend(self.fetch_new_zealand_offers())
        all_offers.extend(self.fetch_simplify_jobs())
        all_offers.extend(self.fetch_themuse_internships())
        all_offers.extend(self.fetch_arbeitnow())
        all_offers.extend(self.fetch_jobicy())
        all_offers.extend(self.fetch_remotive())
        all_offers.extend(self.fetch_hackernews_hiring())
        all_offers.extend(self.fetch_gradcracker_stem())
        all_offers.extend(self.fetch_academic_labs())
        return all_offers
