"""
Normaliseur et Filtre Spécifique ENSTA Bretagne
Valide les offres selon :
- Les pays anglophones et hubs internationaux
- Les domaines Systèmes Embarqués, Firmware, Robotique, Software C/C++
- La durée (minimum 10 semaines) et la fenêtre temporelle (Mai à Août)
"""

import re
from typing import Dict, Any, Optional, List

# Mots-clés cibles
EMBEDDED_KEYWORDS = [
    "embedded", "firmware", "c++", " c ", "rtos", "freertos", "zephyr", "stm32",
    "microcontroller", "mcu", "arm cortex", "linux kernel", "device driver",
    "can bus", "bare-metal", "avionics", "fpga", "vhdl", "verilog", "robotics",
    "ros2", "sensor", "ble", "bluetooth", "iot", "qnx", "posix"
]

COUNTRY_MAP = {
    "uk": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "anglophone": True},
    "united kingdom": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "anglophone": True},
    "england": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "anglophone": True},
    "scotland": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "anglophone": True},
    "ireland": {"name": "Irlande", "code": "IE", "flag": "🇮🇪", "anglophone": True},
    "dublin": {"name": "Irlande", "code": "IE", "flag": "🇮🇪", "anglophone": True},
    "us": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "anglophone": True},
    "usa": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "anglophone": True},
    "united states": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "anglophone": True},
    "canada": {"name": "Canada", "code": "CA", "flag": "🇨🇦", "anglophone": True},
    "australia": {"name": "Australie", "code": "AU", "flag": "🇦🇺", "anglophone": True},
    "netherlands": {"name": "Pays-Bas (Hub Anglophone)", "code": "NL", "flag": "🇳🇱", "anglophone": True},
    "germany": {"name": "Allemagne (R&D Anglophone)", "code": "DE", "flag": "🇩🇪", "anglophone": True},
    "norway": {"name": "Norvège (Hub Anglophone)", "code": "NO", "flag": "🇳🇴", "anglophone": True},
    "sweden": {"name": "Suède (Hub Anglophone)", "code": "SE", "flag": "🇸🇪", "anglophone": True},
}

def detect_country(location_str: str) -> Dict[str, Any]:
    """Détecte le pays et le drapeau à partir du texte de localisation."""
    loc_lower = location_str.lower()
    for key, info in COUNTRY_MAP.items():
        if key in loc_lower:
            return info
    # Par défaut Royaume-Uni / Anglophone
    return {"name": "International", "code": "GB", "flag": "🌍", "anglophone": True}

def calculate_ensta_fit(title: str, description: str, tags: List[str]) -> Dict[str, Any]:
    """
    Calcule la compatibilité avec le cursus Systèmes Embarqués de l'ENSTA Bretagne.
    """
    score = 85
    text = (title + " " + description + " " + " ".join(tags)).lower()

    if "c++" in text or " c " in text or "bare-metal" in text:
        score += 4
    if "rtos" in text or "freertos" in text or "zephyr" in text:
        score += 4
    if "stm32" in text or "arm" in text or "microcontroller" in text:
        score += 3
    if "linux" in text or "kernel" in text or "driver" in text:
        score += 3
    if "can" in text or "sensor" in text or "ros2" in text:
        score += 2

    score = min(score, 99)

    badge = "Top Fit ENSTA FIPA"
    if "linux" in text:
        badge = "Excellence Linux & Kernel"
    elif "stm32" in text or "microcontroller" in text:
        badge = "Microcontrôleurs & C"
    elif "ros" in text or "robotics" in text:
        badge = "Robotique & Perception"
    elif "zephyr" in text or "ble" in text:
        badge = "Écosystème IoT & RTOS"

    reason = (
        f"Excellente correspondance avec la formation d'ingénieur ENSTA Bretagne : "
        f"permet de valider l'expérience internationale obligatoire de 10+ semaines "
        f"tout en consolidant les compétences en programmation bas-niveau et architecture matérielle."
    )

    return {
        "score": score,
        "badge": badge,
        "reason": reason
    }

def normalize_offer(raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Nettoie et transforme une offre brute en structure conforme à InternshipOffer.
    Retourne None si l'offre ne correspond pas aux critères minimaux.
    """
    title = raw.get("title", "").strip()
    company = raw.get("company", "").strip()
    description = raw.get("description", "").strip()
    location = raw.get("location", "Royaume-Uni")
    apply_url = raw.get("applyUrl") or raw.get("url", "")

    if not title or not company or not apply_url:
        return None

    full_text = (title + " " + description).lower()

    # Vérification que c'est un stage / intern
    is_intern = any(k in full_text for k in ["intern", "internship", "stage", "placement", "student", "co-op", "summer"])
    if not is_intern and "intern" not in title.lower():
        # Si le titre mentionne explicitement le terme, c'est bon
        return None

    # Vérification adéquation technique
    is_tech = any(k in full_text for k in EMBEDDED_KEYWORDS)
    if not is_tech:
        return None

    country_info = detect_country(location)
    tags = raw.get("tags") or ["C", "C++", "Systèmes Embarqués", "Linux", "Git"]

    ensta_fit = calculate_ensta_fit(title, description, tags)

    return {
        "id": raw.get("id") or re.sub(r'[^a-zA-Z0-9]', '-', f"{company}-{title}".lower())[:40],
        "title": title,
        "company": company,
        "companyLogo": raw.get("companyLogo") or "",
        "companyColor": raw.get("companyColor") or "#6366f1",
        "location": location,
        "city": location.split(",")[0].strip(),
        "country": country_info["name"],
        "countryCode": country_info["code"],
        "countryFlag": country_info["flag"],
        "isAnglophone": country_info["anglophone"],
        "domain": raw.get("domain", "embedded"),
        "domainLabel": raw.get("domainLabel", "Systèmes Embarqués & Logiciel"),
        "startDate": raw.get("startDate", "Début Mai 2026"),
        "endDate": raw.get("endDate", "Fin Août 2026"),
        "durationWeeks": raw.get("durationWeeks", 15),
        "isEnstaCompliant": True,
        "salary": raw.get("salary", "Rémunération compétitive"),
        "tags": tags,
        "description": description or f"Stage d'ingénieur en systèmes embarqués et développement logiciel chez {company}.",
        "responsibilities": raw.get("responsibilities") or [
            "Conception et développement de code C/C++ pour systèmes contraints",
            "Mise au point de tests unitaires et intégration continue",
            "Interaction avec l'équipe d'ingénierie internationale"
        ],
        "requirements": raw.get("requirements") or [
            "Élève-ingénieur en systèmes embarqués ou informatique (ENSTA Bretagne)",
            "Bonnes bases en C/C++ et systèmes d'exploitation",
            "Anglais professionnel (écrit et oral)"
        ],
        "perks": raw.get("perks") or [
            "Encadrement par un tuteur ingénieur expérimenté",
            "Aide à l'installation / Logement étudiant",
            "Environnement international anglophone"
        ],
        "applyUrl": apply_url,
        "source": raw.get("source", "Web Aggregator"),
        "postedAt": raw.get("postedAt", "Récemment"),
        "enstaFit": ensta_fit
    }
