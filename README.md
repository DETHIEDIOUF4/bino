# AidaFALL

Plateforme de covoiturage quotidien de courte distance — partage des frais entre conducteurs et passagers.

## Architecture

| Dossier    | Stack                          | Description                              |
|------------|--------------------------------|------------------------------------------|
| `backend/` | Node.js, Express, PostgreSQL (Prisma) | API REST, WebSockets, notifications      |
| `mobile/`  | Flutter                        | App iOS/Android (conducteur + passager)  |
| `admin/`   | React + Vite                   | Admin legacy (optionnel) |
| `web/`     | React + Vite                   | Site public bino + **admin `/adminbino`** |

## Fonctionnalités prévues

- Compte unique conducteur / passager / les deux
- Validation admin des permis et documents conducteurs
- Création et recherche de trajets (ponctuels ou récurrents)
- Matching intelligent, partage des frais (4–9,99 $ CAD)
- Paiements Stripe, GPS et suivi temps réel
- Notifications push (FCM) et in-app (Socket.io)
- Tableau de bord municipal (B2G)

## Démarrage rapide

### Prérequis

- Node.js 18+
- PostgreSQL (local, [Neon](https://neon.tech) en cloud — voir [docs/DATABASE.md](docs/DATABASE.md))
- Flutter 3.x
- Compte Firebase (notifications push — phase 2)

### Backend

```bash
cd backend
cp .env.example .env   # DATABASE_URL (Neon ou postgresql://…@localhost:5432/aidafall)
npm install
npm run db:push        # première fois : crée les tables
npm run seed           # optionnel : comptes et trajets de test
npm run dev
```

API : `http://localhost:3001`

### Admin

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

Interface : `http://localhost:5173`

### Site web public (bino)

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

Site : `http://localhost:5174`

**Parcours passager** : `/rechercher` (défaut Québec, tarif auto, matching) → réserver ou **demande ouverte** aux conducteurs → trajet public une fois accepté → `/app`, `/app/mes-trajets`, `/app/trajet/:id`.

**Parcours conducteur — Partager ma voiture** : `/partager-ma-voiture` → `/proposer` (sans compte) → `/inscription-conducteur` → validation admin → `/conducteur`, `/conducteur/trajets`, `/conducteur/demandes`.

Lien public suivi : `/suivi/:bookingId/:token`

Couleurs et logos : dossier `logo/` (guide `bino-guide-de-marque.md`).

### Mobile

```bash
cd mobile
flutter pub get
flutter run
```

Configurer l'URL de l'API dans `lib/core/config/app_config.dart`.

## Structure API (MVP)

| Méthode | Route                    | Description              |
|---------|--------------------------|--------------------------|
| POST    | `/api/auth/register`     | Inscription              |
| POST    | `/api/auth/login`        | Connexion                |
| GET     | `/api/users/me`          | Profil utilisateur       |
| POST    | `/api/trips`             | Créer un trajet          |
| GET     | `/api/trips/search`      | Rechercher des trajets   |
| GET     | `/api/admin/drivers/pending` | Conducteurs en attente |
| PATCH   | `/api/admin/drivers/:id/verify` | Valider un conducteur |

## Documentation

- [Présentation projet & accès propriétaire](docs/PRESENTATION-PROJET.md)
- [Déploiement Render / Netlify](docs/DEPLOY.md)
- [Base de données Neon](docs/DATABASE.md)

## Licence

Projet privé — AidaFALL
