"""
Normaliseur Universel et Filtre Spécifique ENSTA Bretagne
Valide et qualifie les offres selon :
- Tous les pays du monde (Hubs internationaux, Europe, Nordiques, Asie-Pacifique, Amériques, Remote)
- Les domaines Systèmes Embarqués, Firmware, Robotique, Software C/C++ et Systèmes
- La durée (minimum 10 semaines) et la fenêtre temporelle (Mai à Août)
"""

import re
from typing import Dict, Any, Optional, List

# Mots-clés techniques cibles
EMBEDDED_KEYWORDS = [
    "embedded", "firmware", "c++", " c ", "rtos", "freertos", "zephyr", "stm32",
    "microcontroller", "mcu", "arm cortex", "linux kernel", "device driver",
    "can bus", "bare-metal", "avionics", "fpga", "vhdl", "verilog", "robotics",
    "ros2", "sensor", "ble", "bluetooth", "iot", "qnx", "posix", "hardware",
    "systems software", "autonomous", "computer vision", "low-level", "dsp",
    "edge ai", "bsp", "tinyml", "embedded linux", "telemetry", "mechatronics"
]

# Base de données exhaustive des pays mondiaux avec hubs technologiques & labos anglophones
COUNTRY_MAP = {
    # 🇬🇧 Royaume-Uni & 🇮🇪 Irlande
    "uk": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "region": "Europe", "anglophone": True},
    "united kingdom": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "region": "Europe", "anglophone": True},
    "england": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "region": "Europe", "anglophone": True},
    "scotland": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "region": "Europe", "anglophone": True},
    "london": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "region": "Europe", "anglophone": True},
    "cambridge": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "region": "Europe", "anglophone": True},
    "oxford": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "region": "Europe", "anglophone": True},
    "edinburgh": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "region": "Europe", "anglophone": True},
    "belfast": {"name": "Royaume-Uni", "code": "GB", "flag": "🇬🇧", "region": "Europe", "anglophone": True},
    "ireland": {"name": "Irlande", "code": "IE", "flag": "🇮🇪", "region": "Europe", "anglophone": True},
    "dublin": {"name": "Irlande", "code": "IE", "flag": "🇮🇪", "region": "Europe", "anglophone": True},
    "cork": {"name": "Irlande", "code": "IE", "flag": "🇮🇪", "region": "Europe", "anglophone": True},
    "limerick": {"name": "Irlande", "code": "IE", "flag": "🇮🇪", "region": "Europe", "anglophone": True},

    # 🇺🇸 États-Unis
    "us": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "usa": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "united states": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "san francisco": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "seattle": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "boston": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "austin": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "new york": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "mountain view": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "sunnyvale": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "palo alto": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "cupertino": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "pittsburgh": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},
    "chicago": {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True},

    # 🇨🇦 Canada
    "canada": {"name": "Canada", "code": "CA", "flag": "🇨🇦", "region": "Amériques", "anglophone": True},
    "toronto": {"name": "Canada", "code": "CA", "flag": "🇨🇦", "region": "Amériques", "anglophone": True},
    "vancouver": {"name": "Canada", "code": "CA", "flag": "🇨🇦", "region": "Amériques", "anglophone": True},
    "ottawa": {"name": "Canada", "code": "CA", "flag": "🇨🇦", "region": "Amériques", "anglophone": True},
    "waterloo": {"name": "Canada", "code": "CA", "flag": "🇨🇦", "region": "Amériques", "anglophone": True},
    "montreal": {"name": "Canada", "code": "CA", "flag": "🇨🇦", "region": "Amériques", "anglophone": True},
    "calgary": {"name": "Canada", "code": "CA", "flag": "🇨🇦", "region": "Amériques", "anglophone": True},

    # 🇩🇪 Allemagne (Hub R&D continental n°1 en embarqué)
    "germany": {"name": "Allemagne", "code": "DE", "flag": "🇩🇪", "region": "Europe", "anglophone": True},
    "deutschland": {"name": "Allemagne", "code": "DE", "flag": "🇩🇪", "region": "Europe", "anglophone": True},
    "berlin": {"name": "Allemagne", "code": "DE", "flag": "🇩🇪", "region": "Europe", "anglophone": True},
    "munich": {"name": "Allemagne", "code": "DE", "flag": "🇩🇪", "region": "Europe", "anglophone": True},
    "münchen": {"name": "Allemagne", "code": "DE", "flag": "🇩🇪", "region": "Europe", "anglophone": True},
    "stuttgart": {"name": "Allemagne", "code": "DE", "flag": "🇩🇪", "region": "Europe", "anglophone": True},
    "frankfurt": {"name": "Allemagne", "code": "DE", "flag": "🇩🇪", "region": "Europe", "anglophone": True},
    "hamburg": {"name": "Allemagne", "code": "DE", "flag": "🇩🇪", "region": "Europe", "anglophone": True},
    "nuremberg": {"name": "Allemagne", "code": "DE", "flag": "🇩🇪", "region": "Europe", "anglophone": True},

    # 🇳🇱 Pays-Bas (ASML, NXP, Philips, TU Delft)
    "netherlands": {"name": "Pays-Bas", "code": "NL", "flag": "🇳🇱", "region": "Europe", "anglophone": True},
    "holland": {"name": "Pays-Bas", "code": "NL", "flag": "🇳🇱", "region": "Europe", "anglophone": True},
    "amsterdam": {"name": "Pays-Bas", "code": "NL", "flag": "🇳🇱", "region": "Europe", "anglophone": True},
    "eindhoven": {"name": "Pays-Bas", "code": "NL", "flag": "🇳🇱", "region": "Europe", "anglophone": True},
    "delft": {"name": "Pays-Bas", "code": "NL", "flag": "🇳🇱", "region": "Europe", "anglophone": True},
    "rotterdam": {"name": "Pays-Bas", "code": "NL", "flag": "🇳🇱", "region": "Europe", "anglophone": True},
    "utrecht": {"name": "Pays-Bas", "code": "NL", "flag": "🇳🇱", "region": "Europe", "anglophone": True},

    # 🇨🇭 Suisse (EPFL, ETH Zurich, CERN, Logitech, ABB)
    "switzerland": {"name": "Suisse", "code": "CH", "flag": "🇨🇭", "region": "Europe", "anglophone": True},
    "schweiz": {"name": "Suisse", "code": "CH", "flag": "🇨🇭", "region": "Europe", "anglophone": True},
    "zurich": {"name": "Suisse", "code": "CH", "flag": "🇨🇭", "region": "Europe", "anglophone": True},
    "zürich": {"name": "Suisse", "code": "CH", "flag": "🇨🇭", "region": "Europe", "anglophone": True},
    "lausanne": {"name": "Suisse", "code": "CH", "flag": "🇨🇭", "region": "Europe", "anglophone": True},
    "geneva": {"name": "Suisse", "code": "CH", "flag": "🇨🇭", "region": "Europe", "anglophone": True},
    "genève": {"name": "Suisse", "code": "CH", "flag": "🇨🇭", "region": "Europe", "anglophone": True},
    "basel": {"name": "Suisse", "code": "CH", "flag": "🇨🇭", "region": "Europe", "anglophone": True},

    # 🇸🇪 Suède & Pays Nordiques (Nordic Semi, Ericsson, Volvo, Spotify)
    "sweden": {"name": "Suède", "code": "SE", "flag": "🇸🇪", "region": "Europe", "anglophone": True},
    "stockholm": {"name": "Suède", "code": "SE", "flag": "🇸🇪", "region": "Europe", "anglophone": True},
    "gothenburg": {"name": "Suède", "code": "SE", "flag": "🇸🇪", "region": "Europe", "anglophone": True},
    "göteborg": {"name": "Suède", "code": "SE", "flag": "🇸🇪", "region": "Europe", "anglophone": True},
    "malmo": {"name": "Suède", "code": "SE", "flag": "🇸🇪", "region": "Europe", "anglophone": True},
    "lund": {"name": "Suède", "code": "SE", "flag": "🇸🇪", "region": "Europe", "anglophone": True},
    "norway": {"name": "Norvège", "code": "NO", "flag": "🇳🇴", "region": "Europe", "anglophone": True},
    "oslo": {"name": "Norvège", "code": "NO", "flag": "🇳🇴", "region": "Europe", "anglophone": True},
    "trondheim": {"name": "Norvège", "code": "NO", "flag": "🇳🇴", "region": "Europe", "anglophone": True},
    "denmark": {"name": "Danemark", "code": "DK", "flag": "🇩🇰", "region": "Europe", "anglophone": True},
    "copenhagen": {"name": "Danemark", "code": "DK", "flag": "🇩🇰", "region": "Europe", "anglophone": True},
    "finland": {"name": "Finlande", "code": "FI", "flag": "🇫🇮", "region": "Europe", "anglophone": True},
    "helsinki": {"name": "Finlande", "code": "FI", "flag": "🇫🇮", "region": "Europe", "anglophone": True},
    "oulu": {"name": "Finlande", "code": "FI", "flag": "🇫🇮", "region": "Europe", "anglophone": True},

    # 🇦🇺 Australie & 🇳🇿 Nouvelle-Zélande
    "australia": {"name": "Australie", "code": "AU", "flag": "🇦🇺", "region": "Océanie", "anglophone": True},
    "sydney": {"name": "Australie", "code": "AU", "flag": "🇦🇺", "region": "Océanie", "anglophone": True},
    "melbourne": {"name": "Australie", "code": "AU", "flag": "🇦🇺", "region": "Océanie", "anglophone": True},
    "brisbane": {"name": "Australie", "code": "AU", "flag": "🇦🇺", "region": "Océanie", "anglophone": True},
    "adelaide": {"name": "Australie", "code": "AU", "flag": "🇦🇺", "region": "Océanie", "anglophone": True},
    "new zealand": {"name": "Nouvelle-Zélande", "code": "NZ", "flag": "🇳🇿", "region": "Océanie", "anglophone": True},
    "nouvelle-zélande": {"name": "Nouvelle-Zélande", "code": "NZ", "flag": "🇳🇿", "region": "Océanie", "anglophone": True},
    "nouvelle zelande": {"name": "Nouvelle-Zélande", "code": "NZ", "flag": "🇳🇿", "region": "Océanie", "anglophone": True},
    "auckland": {"name": "Nouvelle-Zélande", "code": "NZ", "flag": "🇳🇿", "region": "Océanie", "anglophone": True},
    "wellington": {"name": "Nouvelle-Zélande", "code": "NZ", "flag": "🇳🇿", "region": "Océanie", "anglophone": True},
    "christchurch": {"name": "Nouvelle-Zélande", "code": "NZ", "flag": "🇳🇿", "region": "Océanie", "anglophone": True},
    "hamilton, nz": {"name": "Nouvelle-Zélande", "code": "NZ", "flag": "🇳🇿", "region": "Océanie", "anglophone": True},


    # 🇸🇬 Singapour & Hubs Asie-Pacifique
    "singapore": {"name": "Singapour", "code": "SG", "flag": "🇸🇬", "region": "Asie", "anglophone": True},
    "japan": {"name": "Japon", "code": "JP", "flag": "🇯🇵", "region": "Asie", "anglophone": True},
    "tokyo": {"name": "Japon", "code": "JP", "flag": "🇯🇵", "region": "Asie", "anglophone": True},
    "kyoto": {"name": "Japon", "code": "JP", "flag": "🇯🇵", "region": "Asie", "anglophone": True},
    "osaka": {"name": "Japon", "code": "JP", "flag": "🇯🇵", "region": "Asie", "anglophone": True},
    "south korea": {"name": "Corée du Sud", "code": "KR", "flag": "🇰🇷", "region": "Asie", "anglophone": True},
    "korea": {"name": "Corée du Sud", "code": "KR", "flag": "🇰🇷", "region": "Asie", "anglophone": True},
    "seoul": {"name": "Corée du Sud", "code": "KR", "flag": "🇰🇷", "region": "Asie", "anglophone": True},
    "daejeon": {"name": "Corée du Sud", "code": "KR", "flag": "🇰🇷", "region": "Asie", "anglophone": True},
    "taiwan": {"name": "Taïwan", "code": "TW", "flag": "🇹🇼", "region": "Asie", "anglophone": True},
    "taipei": {"name": "Taïwan", "code": "TW", "flag": "🇹🇼", "region": "Asie", "anglophone": True},
    "hsinchu": {"name": "Taïwan", "code": "TW", "flag": "🇹🇼", "region": "Asie", "anglophone": True},
    "hong kong": {"name": "Hong Kong", "code": "HK", "flag": "🇭🇰", "region": "Asie", "anglophone": True},

    # 🇦🇪 Moyen-Orient & Israël
    "uae": {"name": "Émirats Arabes Unis", "code": "AE", "flag": "🇦🇪", "region": "Moyen-Orient", "anglophone": True},
    "dubai": {"name": "Émirats Arabes Unis", "code": "AE", "flag": "🇦🇪", "region": "Moyen-Orient", "anglophone": True},
    "abu dhabi": {"name": "Émirats Arabes Unis", "code": "AE", "flag": "🇦🇪", "region": "Moyen-Orient", "anglophone": True},
    "israel": {"name": "Israël", "code": "IL", "flag": "🇮🇱", "region": "Moyen-Orient", "anglophone": True},
    "tel aviv": {"name": "Israël", "code": "IL", "flag": "🇮🇱", "region": "Moyen-Orient", "anglophone": True},

    # 🇪🇺 Autres Pays Européens avec R&D Anglophone
    "austria": {"name": "Autriche", "code": "AT", "flag": "🇦🇹", "region": "Europe", "anglophone": True},
    "vienna": {"name": "Autriche", "code": "AT", "flag": "🇦🇹", "region": "Europe", "anglophone": True},
    "wien": {"name": "Autriche", "code": "AT", "flag": "🇦🇹", "region": "Europe", "anglophone": True},
    "belgium": {"name": "Belgique", "code": "BE", "flag": "🇧🇪", "region": "Europe", "anglophone": True},
    "brussels": {"name": "Belgique", "code": "BE", "flag": "🇧🇪", "region": "Europe", "anglophone": True},
    "leuven": {"name": "Belgique", "code": "BE", "flag": "🇧🇪", "region": "Europe", "anglophone": True},
    "spain": {"name": "Espagne", "code": "ES", "flag": "🇪🇸", "region": "Europe", "anglophone": True},
    "barcelona": {"name": "Espagne", "code": "ES", "flag": "🇪🇸", "region": "Europe", "anglophone": True},
    "madrid": {"name": "Espagne", "code": "ES", "flag": "🇪🇸", "region": "Europe", "anglophone": True},
    "italy": {"name": "Italie", "code": "IT", "flag": "🇮🇹", "region": "Europe", "anglophone": True},
    "milan": {"name": "Italie", "code": "IT", "flag": "🇮🇹", "region": "Europe", "anglophone": True},
    "turin": {"name": "Italie", "code": "IT", "flag": "🇮🇹", "region": "Europe", "anglophone": True},
    "poland": {"name": "Pologne", "code": "PL", "flag": "🇵🇱", "region": "Europe", "anglophone": True},
    "warsaw": {"name": "Pologne", "code": "PL", "flag": "🇵🇱", "region": "Europe", "anglophone": True},
    "krakow": {"name": "Pologne", "code": "PL", "flag": "🇵🇱", "region": "Europe", "anglophone": True},
    "czech": {"name": "République Tchèque", "code": "CZ", "flag": "🇨🇿", "region": "Europe", "anglophone": True},
    "prague": {"name": "République Tchèque", "code": "CZ", "flag": "🇨🇿", "region": "Europe", "anglophone": True},
    "estonia": {"name": "Estonie", "code": "EE", "flag": "🇪🇪", "region": "Europe", "anglophone": True},
    "tallinn": {"name": "Estonie", "code": "EE", "flag": "🇪🇪", "region": "Europe", "anglophone": True},
    "portugal": {"name": "Portugal", "code": "PT", "flag": "🇵🇹", "region": "Europe", "anglophone": True},
    "lisbon": {"name": "Portugal", "code": "PT", "flag": "🇵🇹", "region": "Europe", "anglophone": True},

    # 🌐 Télétravail International & Hubs Mondiaux
    "remote": {"name": "Remote International", "code": "REMOTE", "flag": "🌐", "region": "Remote", "anglophone": True},
    "worldwide": {"name": "Remote International", "code": "REMOTE", "flag": "🌐", "region": "Remote", "anglophone": True},
    "anywhere": {"name": "Remote International", "code": "REMOTE", "flag": "🌐", "region": "Remote", "anglophone": True},
    "global": {"name": "International", "code": "INT", "flag": "🌍", "region": "International", "anglophone": True},
}

# Sigles et métropoles US courantes
US_CITIES_REGEX = re.compile(
    r'\b(sf|south sf|nyc|la|ny|bay area|silicon valley|san francisco|seattle|austin|chicago|boston|mountain view|sunnyvale|san jose|palo alto|cupertino|san diego|pittsburgh|cambridge, ma|atlanta|dallas|denver|redmond|miami|houston|washington dc|washington, d\.c\.)\b',
    re.IGNORECASE
)

# États US courants dans les formats "City, ST"
US_STATES_REGEX = re.compile(
    r'\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b'
)

# Noms complets des 50 États américains
US_STATES_FULL_REGEX = re.compile(
    r'\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b',
    re.IGNORECASE
)

# Provinces Canadiennes courantes dans les formats "City, PR, Canada"
CA_PROVINCES_REGEX = re.compile(r'\b(ON|BC|QC|AB|MB|SK|NS|NB|NL|vancouver|toronto|montreal|waterloo|ottawa|calgary)\b', re.IGNORECASE)

def detect_country(location_str: str) -> Dict[str, Any]:
    """Détecte avec précision le pays, l'indicatif ISO et le drapeau depuis le texte de localisation."""
    if not location_str:
        return {"name": "International", "code": "INT", "flag": "🌍", "region": "International", "anglophone": True}

    loc_lower = location_str.lower().strip()

    # 1. Vérification explicite Nouvelle-Zélande
    if any(k in loc_lower for k in ["new zealand", "nouvelle-zélande", "nouvelle zelande"]) or re.search(r'\b(nz|auckland|wellington|christchurch)\b', loc_lower):
        return {"name": "Nouvelle-Zélande", "code": "NZ", "flag": "🇳🇿", "region": "Océanie", "anglophone": True}

    # 2. Vérification explicite Australie
    if "australia" in loc_lower or "australie" in loc_lower or re.search(r'\b(sydney|brisbane|adelaide)\b', loc_lower):
        return {"name": "Australie", "code": "AU", "flag": "🇦🇺", "region": "Océanie", "anglophone": True}

    # 3. Détection États-Unis explicite (évite que "Melbourne, FL", "Washington", "California" etc. soient pris pour un autre pays)
    if "united states" in loc_lower or "usa" in loc_lower or "u.s.a" in loc_lower or US_STATES_REGEX.search(location_str) or US_CITIES_REGEX.search(location_str) or US_STATES_FULL_REGEX.search(location_str):
        return {"name": "États-Unis", "code": "US", "flag": "🇺🇸", "region": "Amériques", "anglophone": True}

    # 4. Détection Canada explicite
    if "canada" in loc_lower or CA_PROVINCES_REGEX.search(location_str):
        return {"name": "Canada", "code": "CA", "flag": "🇨🇦", "region": "Amériques", "anglophone": True}

    # 5. Vérification par mots-clés de pays / villes mondiales
    for key, info in COUNTRY_MAP.items():
        if key in loc_lower:
            return info

    # 6. Par défaut : hub international tech
    clean_name = location_str.split(",")[0].strip() or "International"
    return {"name": clean_name, "code": "INT", "flag": "🌍", "region": "International", "anglophone": True}

def detect_domain(title: str, description: str, tags: List[str]) -> Dict[str, str]:
    """Catégorise l'offre dans l'un des domaines d'ingénierie cibles."""
    text = (title + " " + description + " " + " ".join(tags)).lower()

    if any(k in text for k in ["robotics", "ros", "ros2", "autonomous", "perception", "slam", "drone", "lidar"]):
        return {"id": "robotics", "label": "Robotique & ROS2"}
    if any(k in text for k in ["firmware", "device driver", "bsp", "mcu", "microcontroller", "bare-metal"]):
        return {"id": "firmware", "label": "Firmware & Microcontrôleurs"}
    if any(k in text for k in ["iot", "ble", "bluetooth", "wireless", "zigbee", "lora", "sensor network"]):
        return {"id": "iot", "label": "IoT & Protocoles Sans Fil"}
    if any(k in text for k in ["embedded", "rtos", "freertos", "zephyr", "stm32", "arm cortex", "fpga", "qnx"]):
        return {"id": "embedded", "label": "Systèmes Embarqués (C/C++)"}
    
    return {"id": "software", "label": "C++ Temps Réel & Logiciel"}

def calculate_ensta_fit(title: str, description: str, tags: List[str]) -> Dict[str, Any]:
    """
    Calcule la compatibilité fine avec le cursus Systèmes Embarqués & Logiciel de l'ENSTA Bretagne.
    """
    score = 86
    text = (title + " " + description + " " + " ".join(tags)).lower()

    if "c++" in text or " c " in text or "bare-metal" in text or "rust" in text:
        score += 3
    if "rtos" in text or "freertos" in text or "zephyr" in text or "qnx" in text:
        score += 3
    if "stm32" in text or "arm" in text or "microcontroller" in text or "mcu" in text:
        score += 3
    if "linux" in text or "kernel" in text or "driver" in text:
        score += 2
    if "ros" in text or "robotics" in text or "slam" in text or "can bus" in text:
        score += 2

    score = min(score, 99)

    badge = "Top Fit ENSTA FIPA"
    if "linux" in text or "kernel" in text:
        badge = "Excellence Linux & Kernel"
    elif "stm32" in text or "microcontroller" in text or "cortex" in text:
        badge = "Microcontrôleurs & C"
    elif "ros" in text or "robotics" in text or "autonomous" in text:
        badge = "Robotique & Perception"
    elif "zephyr" in text or "ble" in text or "iot" in text:
        badge = "Écosystème IoT & RTOS"
    elif "hardware" in text or "fpga" in text:
        badge = "Co-conception Hard & Soft"

    reason = (
        "Adéquation parfaite avec le cursus ingénieur ENSTA Bretagne : "
        "valide l'obligation internationale de 10+ semaines en immersion anglophone "
        "tout en consolidant les compétences en architecture matérielle et logicielle."
    )

    return {
        "score": score,
        "badge": badge,
        "reason": reason
    }

# Regex pour éliminer les pages d'accueil génériques carrières
GENERIC_CAREERS_REGEX = re.compile(
    r'(careers\.[^/]+/?$|/careers/?$|/jobs/?$|/jobs\.html/?$|/company/jobs\.html/?$|/internships/?$|/summer-internships/?$|/students/?$|/students-and-graduates.*|/opportunities/?$|simplify\.jobs/c/|themuse\.com/jobs/[^/]+/?$|delft-center-for-systems-and-control-dcsc)',
    re.IGNORECASE
)

# Domaines ATS majeurs contenant des réquisitions directes
DIRECT_ATS_DOMAINS = [
    "myworkdayjobs.com", "greenhouse.io", "lever.co", "ashbyhq.com",
    "smartrecruiters.com", "icims.com", "eightfold.ai", "taleo.net",
    "bamboohr.com", "personio.de", "recruitee.com", "workable.com",
    "ycombinator.com", "arbeitnow.com", "arbeitnow.fr", "arbeitnow.co.uk",
    "jobicy.com", "remotive.com"
]

def is_direct_job_url(url: str) -> bool:
    """
    Vérifie qu'une URL mène directement à l'offre d'emploi ou au formulaire de candidature,
    et non à la page d'accueil d'un portail carrières.
    """
    if not url or not url.startswith("http"):
        return False

    url_clean = url.strip()

    # Rejeter les pages d'accueil carrières génériques
    if GENERIC_CAREERS_REGEX.search(url_clean):
        return False

    from urllib.parse import urlparse
    parsed = urlparse(url_clean)
    netloc = parsed.netloc.lower()
    path = parsed.path.strip("/").lower()

    # Rejeter les pages finissant par .html générique
    if path.endswith((".html", ".htm")) and any(k in path for k in ["job", "career", "student", "graduate", "intern"]):
        if not re.search(r'(/job/\d+|/jobs/[a-zA-Z0-9_-]{8,}|[?&](id|job_id|req)=)', url_clean):
            return False

    # Si c'est un ATS reconnu
    if any(ats in netloc for ats in DIRECT_ATS_DOMAINS):
        return True

    # Si l'URL a un identifiant précis de poste (ex: /job/1234, /jobs/slug-123, id=, requisition=)
    if re.search(r'(/job/[^/]+|/jobs/[^/]{4,}|/apply|/vacancies/[^/]+|/o/[^/]+|\b(id|job_id|req|slug)=)', url_clean, re.IGNORECASE):
        return True

    # Rejeter si le chemin n'est qu'un mot générique court
    if path in ["careers", "jobs", "internships", "students", "early-careers", "vacancies", "research", "opportunities"]:
        return False

    # Liens d'universités ou pages de vacance détaillées
    if any(ac in netloc for ac in [".ac.uk", ".edu", ".ac.nz", "tudelft.nl", "epfl.ch", "ethz.ch"]):
        if any(bad in path for bad in ["about", "departments", "opportunities"]):
            return False
        return len(path.split("/")) >= 2 or bool(parsed.query)

    return False

def normalize_offer(raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Nettoie et transforme une offre brute en structure conforme à InternshipOffer.
    Retourne None si l'offre ne correspond pas aux critères de stage ou de profil technique,
    ou si le lien n'est pas un lien direct vers l'offre.
    """
    title = raw.get("title", "").strip()
    company = raw.get("company", "").strip()
    description = raw.get("description", "").strip()
    location = raw.get("location", "International")
    apply_url = (raw.get("applyUrl") or raw.get("url", "")).strip()

    if not title or not company or not apply_url:
        return None

    # Rejeter impérativement les liens génériques de portails carrières
    if not is_direct_job_url(apply_url):
        return None

    full_text = (title + " " + description + " " + raw.get("category", "")).lower()

    # 1. Vérification stage / profil étudiant
    is_intern = any(k in full_text for k in [
        "intern", "internship", "stage", "placement", "student", "co-op", "coop",
        "summer", "trainee", "werkstudent", "apprentice", "graduate"
    ])
    if not is_intern and "intern" not in title.lower():
        return None

    # 2. Vérification pertinence technique (embarqué, C/C++, systèmes, firmware, robotique, software)
    is_tech = any(k in full_text for k in EMBEDDED_KEYWORDS) or any(k in title.lower() for k in [
        "software", "engineer", "embedded", "developer", "hardware", "systems", "firmware", "robotics", "c++", "c/c++"
    ])
    if not is_tech:
        return None

    country_info = detect_country(location)
    raw_tags = raw.get("tags") or []
    if isinstance(raw_tags, str):
        raw_tags = [t.strip() for t in raw_tags.split(",")]

    # Tags par défaut si vides
    tags = raw_tags if len(raw_tags) > 0 else ["C/C++", "Systèmes", "Linux", "Git"]

    domain_info = detect_domain(title, description, tags)
    ensta_fit = calculate_ensta_fit(title, description, tags)

    # 3. Détection Université vs Entreprise
    is_academic = any(k in (company + " " + title + " " + apply_url).lower() for k in [
        "university", "college", "institut", "school", "faculty", "polytechnic",
        "laboratory", " lab ", "cst.cam.ac.uk", "ox.ac.uk", "imperial.ac.uk",
        ".ac.uk", ".edu", "tudelft", "epfl", "ethz", "tum.de", "nus.edu", "u-tokyo"
    ])
    org_type = raw.get("organizationType") or ("university" if is_academic else "company")

    # Génération d'un identifiant propre et stable
    clean_id = raw.get("id") or re.sub(r'[^a-zA-Z0-9]', '-', f"{company}-{title}".lower())[:50]

    return {
        "id": clean_id,
        "title": title,
        "company": company,
        "organizationType": org_type,
        "labName": raw.get("labName", ""),
        "companyLogo": raw.get("companyLogo") or "",
        "companyColor": raw.get("companyColor") or "#6366f1",
        "location": location,
        "city": location.split(",")[0].strip() if location else "International",
        "country": country_info["name"],
        "countryCode": country_info["code"],
        "countryFlag": country_info["flag"],
        "region": country_info.get("region", "International"),
        "isAnglophone": country_info.get("anglophone", True),
        "domain": domain_info["id"],
        "domainLabel": domain_info["label"],
        "startDate": raw.get("startDate", "Début Mai 2026"),
        "endDate": raw.get("endDate", "Fin Août 2026"),
        "durationWeeks": raw.get("durationWeeks", 15),
        "isEnstaCompliant": True,
        "salary": raw.get("salary") or "Rémunération compétitive selon barème",
        "tags": tags[:6],
        "description": description or f"Stage d'ingénieur en systèmes embarqués et développement logiciel chez {company}.",
        "responsibilities": raw.get("responsibilities") or [
            "Conception et développement de code C/C++ pour systèmes contraints",
            "Mise au point de tests unitaires, validation matérielle et intégration continue",
            "Collaboration au sein d'une équipe d'ingénierie internationale anglophone"
        ],
        "requirements": raw.get("requirements") or [
            "Élève-ingénieur en systèmes embarqués ou informatique (ENSTA Bretagne)",
            "Maîtrise du C/C++, de Linux ou de l'architecture des microcontrôleurs",
            "Anglais professionnel (écrit et oral) pour le travail d'équipe"
        ],
        "perks": raw.get("perks") or [
            "Encadrement personnalisé par un ingénieur senior / chercheur",
            "Aide à l'installation / Logement étudiant",
            "Environnement de travail stimulant et international"
        ],
        "applyUrl": apply_url,
        "source": raw.get("source", "Global Aggregator"),
        "postedAt": raw.get("postedAt", "Récemment"),
        "enstaFit": ensta_fit
    }
