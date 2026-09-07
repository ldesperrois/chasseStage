"""
Module Anti-Détection & Anti-Captcha Haute Performance pour StageMatch
Utilise curl_cffi pour émuler une véritable empreinte TLS/JA3 de Google Chrome 124,
rotation d'en-têtes HTTP/2 modernes et temporisation humaine (jitter).
"""

import time
import random
import logging
from typing import Dict, Any, Optional
from curl_cffi import requests as curl_requests

logger = logging.getLogger("anti_detect")

REAL_USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0"
]

def get_stealth_headers(referer: Optional[str] = None) -> Dict[str, str]:
    """Génère un jeu complet d'en-têtes HTTP/2 indifférenciables d'un navigateur humain."""
    ua = random.choice(REAL_USER_AGENTS)
    headers = {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"' if "Macintosh" in ua else ('"Windows"' if "Windows" in ua else '"Linux"'),
    }
    if referer:
        headers["Referer"] = referer
        headers["Sec-Fetch-Site"] = "same-origin"

    return headers

def human_delay(min_seconds: float = 0.8, max_seconds: float = 1.8):
    """Pause pseudo-aléatoire avec distribution pour imiter le comportement d'un navigateur réel."""
    time.sleep(random.uniform(min_seconds, max_seconds))

class StealthClient:
    """Client HTTP résistant aux captchas (Cloudflare / DataDome) via impersonation TLS Chrome 124."""
    def __init__(self):
        try:
            self.session = curl_requests.Session(impersonate="chrome124")
            self.has_curl_cffi = True
            logger.info("🛡️ Moteur Anti-Captcha : curl_cffi activé avec empreinte TLS Chrome 124 !")
        except Exception as e:
            import requests
            self.session = requests.Session()
            self.has_curl_cffi = False
            logger.warning(f"Fallback requests standard ({e})")

    def get(self, url: str, headers: Optional[Dict[str, str]] = None, timeout: int = 15, retries: int = 2) -> Optional[str]:
        """Effectue une requête GET avec rotation d'en-têtes, gestion des retries et temporisation."""
        req_headers = get_stealth_headers()
        if headers:
            req_headers.update(headers)

        human_delay(0.5, 1.2)

        for attempt in range(retries + 1):
            try:
                resp = self.session.get(url, headers=req_headers, timeout=timeout)
                if resp.status_code == 200:
                    return resp.text
                elif resp.status_code == 429:
                    # Rate limited -> pause exponentielle
                    wait = 3 * (attempt + 1)
                    logger.warning(f"Rate limit sur {url}, pause de {wait}s...")
                    time.sleep(wait)
                else:
                    logger.warning(f"Statut HTTP {resp.status_code} pour {url}")
                    return None
            except Exception as e:
                if attempt == retries:
                    logger.error(f"Erreur requête sur {url}: {e}")
                    return None
                time.sleep(1.5)
        return None

    def get_json(self, url: str, headers: Optional[Dict[str, str]] = None, timeout: int = 15) -> Optional[Any]:
        """Récupère et parse directement du JSON avec en-têtes JSON appropriés."""
        h = {"Accept": "application/json"}
        if headers:
            h.update(headers)
        raw = self.get(url, headers=h, timeout=timeout)
        if not raw:
            return None
        import json
        try:
            return json.loads(raw)
        except Exception as e:
            logger.warning(f"Erreur parsing JSON de {url}: {e}")
            return None
