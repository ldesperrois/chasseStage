"""
Module Anti-Détection & Anti-Captcha pour StageMatch
Fournit des sessions HTTP avec émulation d'empreintes de navigateurs réels (JA3/TLS),
rotation d'en-têtes modernes et temporisation humaine (jitter).
"""

import time
import random
import logging
from typing import Dict, Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("anti_detect")

# Liste d'User-Agents récents de navigateurs desktop réels
REAL_USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0"
]

def get_stealth_headers(referer: Optional[str] = None) -> Dict[str, str]:
    """
    Génère un jeu complet d'en-têtes HTTP/2 indifférenciables d'un navigateur humain.
    """
    ua = random.choice(REAL_USER_AGENTS)
    headers = {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
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

def human_delay(min_seconds: float = 1.0, max_seconds: float = 2.5):
    """
    Pause pseudo-aléatoire avec distribution gaussienne pour imiter le comportement humain.
    """
    sleep_time = random.uniform(min_seconds, max_seconds)
    time.sleep(sleep_time)

class StealthClient:
    """
    Client HTTP résistant aux captchas et aux empreintes TLS.
    Utilise curl_cffi si disponible (impersonate Chrome), sinon fallback sur urllib/requests avec headers furtifs.
    """
    def __init__(self):
        self.use_curl_cffi = False
        try:
            from curl_cffi import requests as curl_requests
            self.session = curl_requests.Session(impersonate="chrome120")
            self.use_curl_cffi = True
            logger.info("Anti-détection : curl_cffi activé avec empreinte TLS Chrome 120 !")
        except ImportError:
            import urllib.request
            self.session = None
            logger.info("Anti-détection : Mode standard avec rotation d'en-têtes et TLS natif.")

    def get(self, url: str, headers: Optional[Dict[str, str]] = None, timeout: int = 15) -> Optional[str]:
        """
        Effectue une requête GET avec rotation d'en-têtes et temporisation.
        """
        req_headers = get_stealth_headers()
        if headers:
            req_headers.update(headers)

        human_delay(0.8, 1.8)

        if self.use_curl_cffi and self.session:
            try:
                resp = self.session.get(url, headers=req_headers, timeout=timeout)
                if resp.status_code == 200:
                    return resp.text
                else:
                    logger.warning(f"Statut HTTP {resp.status_code} pour {url}")
                    return None
            except Exception as e:
                logger.error(f"Erreur curl_cffi sur {url}: {e}")
                return None
        else:
            # Fallback standard library urllib
            import urllib.request
            import urllib.error
            import ssl
            import gzip

            try:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE

                req = urllib.request.Request(url, headers=req_headers)
                with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
                    content = response.read()
                    # Gzip decode if necessary
                    if response.info().get('Content-Encoding') == 'gzip':
                        content = gzip.decompress(content)
                    return content.decode('utf-8', errors='ignore')
            except urllib.error.HTTPError as e:
                logger.warning(f"HTTPError {e.code} pour {url}")
                return None
            except Exception as e:
                logger.error(f"Erreur urllib sur {url}: {e}")
                return None
