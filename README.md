# 🔥 StageMatch — "Tinder" de Stages à l'Étranger
### Spécialisé Systèmes Embarqués & Logiciel | Conçu pour les élèves de l'ENSTA Bretagne

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com)

**StageMatch** est une application web moderne type Tinder ("Swipe to Apply") spécialement calibrée pour les étudiants de l'**ENSTA Bretagne** (notamment en alternance FIPA Systèmes Embarqués / Logiciel) recherchant un stage à l'étranger dans des pays anglophones ou hubs R&D internationaux entre **début mai et fin août 2026** (critère impératif : **minimum 10 semaines**).

---

## 🌟 Fonctionnalités Principales

### 1. 📱 Interface Tinder Mobile & Desktop Fluide
- **Sur Mobile** : Gestes tactiles natifs (Swipe à droite pour matcher, swipe à gauche pour passer, swipe vers le haut pour superlike/détails).
- **Sur Ordinateur** : Drag & drop fluide à la souris ou **raccourcis clavier** ultra rapides :
  - `→` (Flèche droite) : **Liker / Sauvegarder** l'offre
  - `←` (Flèche gauche) : **Passer** l'offre
  - `↑` (Flèche haut) : **Superlike** (priorité maximale)
  - `Espace` ou `Entrée` : **Ouvrir directement le lien de candidature** sur le site officiel
  - `I` : **Ouvrir la fiche complète** (missions, salaire, prérequis)
  - `Z` ou `Backspace` : **Annuler le dernier swipe (Rewind)**

### 2. 🎯 Ciblage Précis Cursus ENSTA Bretagne
- **Technologies filtrées** : C, C++, FreeRTOS, Zephyr, Noyau Linux, Microcontrôleurs STM32/ESP32, Bus CAN/CAN-FD, Drivers, Robotique ROS2, FPGA, DSP Audio, etc.
- **Vérification automatique de conformité** :
  - Durée $\ge$ 10 semaines validée avec badge vert.
  - Période début mai à fin août 2026.
  - Calcul d'un **score de compatibilité ENSTA (85% à 99%)** avec explication détaillée du lien avec le programme académique.

### 3. 🌍 Pays Anglophones & Hubs R&D Internationaux
- 🇬🇧 **Royaume-Uni** : ARM (Cambridge), Raspberry Pi, McLaren Applied (F1 Telemetry), Dyson R&D, STMicroelectronics (Édimbourg).
- 🇮🇪 **Irlande (UE - Aucun visa requis !)** : Analog Devices (Limerick), Qualcomm (Cork), Intel.
- 🇺🇸 **États-Unis** : Garmin (Avionique), Formlabs (Impression 3D Boston), Tesla (Firmware Autopilot).
- 🇨🇦 **Canada** : BlackBerry QNX (RTOS Kernel Ottawa), MDA Space (Canadarm Toronto).
- 🇳🇱 **Pays-Bas** : ASML (Lithographie EUV Veldhoven), NXP Semiconductors (Radar ADAS Eindhoven) — *Environnements 100% anglophones*.
- 🇩🇪 **Allemagne** : Bosch Research (Robotique ROS2), Siemens Mobility (SIL-4 ferroviaire).
- 🇳🇴 **Scandinavie** : Nordic Semiconductor (BLE & Zephyr RTOS).

### 4. 📊 Suivi des Candidatures & Export Excel / CSV
- Tableau de bord complet **"Mes Matchs"**.
- Statuts d'avancement personnalisables : *À postuler*, *Candidature envoyée*, *Entretien RH / Tech*, *Offre reçue*, *Refusé*.
- Notes personnelles (dates de relance, contacts RH, version du CV).
- **Bouton d'export en 1 clic vers CSV/Excel** pour transmettre directement votre tableau de recherche de stage à vos tuteurs ENSTA Bretagne !

### 5. 🕷️ Scrappeur Python Anti-Captcha Intégré
- Situé dans le dossier `scraper/` :
  - Utilisation de `curl_cffi` pour imiter les empreintes TLS et JA3 de vrais navigateurs Chrome/Safari.
  - Rotation dynamique d'en-têtes HTTP/2 complets (`Sec-Ch-Ua`, `Sec-Fetch-*`, `Accept-Language`).
  - Temporisation humaine (jitter aléatoire) pour éviter les blocages Cloudflare/DataDome.
  - Normalisation automatique et injection directe dans `src/data/offers.json` et `public/data/offers.json`.

---

## 🚀 Démarrage Rapide en Local

### Prérequis
- Node.js (version 20+)
- Python 3.10+ (pour lancer le scrappeur)

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancer l'application en mode développement
```bash
npm run dev
```
Ouvrez votre navigateur à l'adresse indiquée (ex: `http://localhost:5173`).

### 3. Compiler pour la production
```bash
npm run build
```
Les fichiers statiques optimisés sont générés dans le dossier `dist/`.

---

## 🕷️ Utilisation du Scrappeur Anti-Captcha

Pour actualiser les offres ou collecter de nouveaux stages :

```bash
# Option 1 : Via script npm
npm run scrape

# Option 2 : En direct avec Python
python3 scraper/main.py
```

Le script va automatiquement interroger les flux d'ingénierie, filtrer les postes pertinents pour l'ENSTA Bretagne (C/C++, embarqué, pays anglophones, $\ge$ 10 semaines), fusionner avec les offres existantes et mettre à jour le catalogue.

---

## ☁️ Déploiement en 2 Minutes sur Netlify

L'application est 100% statique et configurée avec `netlify.toml` (redirection SPA `/* -> /index.html` et headers de sécurité).

### Méthode 1 : Glisser-déposer (Le plus simple, sans compte GitHub)
1. Exécutez `npm run build` sur votre machine.
2. Rendez-vous sur [Netlify Drop](https://app.netlify.com/drop).
3. Glissez-déposez le dossier **`dist/`** dans la zone de dépôt.
4. Votre site est instantanément en ligne avec une URL HTTPS sécurisée !

### Méthode 2 : Via GitHub (Déploiement Continu Automatique)
1. Poussez ce dossier sur votre compte GitHub :
   ```bash
   git init
   git add .
   git commit -m "feat: StageMatch application"
   git branch -M main
   git remote add origin https://github.com/votre-compte/stagematch.git
   git push -u origin main
   ```
2. Sur Netlify, cliquez sur **"Add new site" > "Import an existing project"**.
3. Sélectionnez votre dépôt GitHub.
4. Les paramètres sont détectés automatiquement grâce à notre fichier `netlify.toml` :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
5. Cliquez sur **Deploy** ! Chaque nouveau push mettra à jour votre site en direct.

---

## 🎓 Spécificités Cursus ENSTA Bretagne (Alternance S3)

| Critère École | Prise en compte dans l'application |
| :--- | :--- |
| **Période mai - fin août** | Toutes les offres ciblent explicitement la période estivale. |
| **Durée minimale de 10 semaines** | Filtre strict $\ge$ 10 semaines actif par défaut (la plupart des offres font 12 à 16 semaines). |
| **Dimension internationale** | 100% des postes situés dans des pays anglophones ou hubs R&D internationaux. |
| **Contenu technique** | C, C++, Microcontrôleurs, Linux kernel, RTOS, Bus de communication (CAN/SPI/I2C). |
| **Suivi tuteur académique** | Export CSV complet prêt à envoyer à votre responsable d'alternance. |

---

*Développé avec ❤️ pour la réussite des stages à l'international des élèves-ingénieurs ENSTA Bretagne.*
