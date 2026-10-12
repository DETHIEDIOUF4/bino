# Déploiement — Render (API) + Netlify (web)

## Prérequis

1. Dépôt **GitHub** avec ce projet (Render et Netlify se connectent à GitHub).
2. Base **Neon** déjà configurée (`DATABASE_URL`).
3. URLs finales notées : API Render, site web Netlify, (optionnel) admin Netlify.

---

## 1. Backend sur Render

1. [render.com](https://render.com) → **New** → **Web Service** → repo GitHub (`bino` ou autre).
2. Paramètres (**monorepo — indispensable**) :
   - **Root Directory** : `backend` ← sans ça, Render build à la racine et `npm ci` échoue
   - **Runtime** : Node
   - **Build Command** : `npm install && npx prisma generate`
   - **Start Command** : `npm start`
   - **Health Check Path** : `/api/health`

   Dans l’UI Render : *Settings → Build & Deploy → Root Directory* = `backend`, puis **Save Changes** et **Manual Deploy**.
3. **Environment** (copier depuis `backend/.env`, **sans** commiter de secrets) :

| Variable | Exemple |
|----------|---------|
| `DATABASE_URL` | `postgresql://…neon…?sslmode=require` |
| `JWT_SECRET` | longue chaîne aléatoire |
| `WEB_URL` | `https://votre-site.netlify.app` |
| `CLIENT_URL` | `https://votre-admin.netlify.app` (si admin séparé) |
| `MOBILE_URL` | `*` |
| `GOOGLE_MAPS_API_KEY` | clé Google Places |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | compte admin initial |
| `PLATFORM_PAYMENTS` | `true` |
| Stripe (optionnel) | `STRIPE_SECRET_KEY`, etc. |

4. Déployer. URL API : `https://aidafall-api.onrender.com` (exemple).
5. Vérifier : `GET https://…/api/health`

**Note :** le disque Render est éphémère — les fichiers dans `uploads/` ne persistent pas ; prévoir S3/Cloudinary plus tard.

Alternative : **New → Blueprint** si `render.yaml` est à la racine du repo.

---

## 2. Web passager sur Netlify

1. [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**.
2. Repo GitHub, branche `main`.
3. Netlify lit `netlify.toml` à la racine (`base = web`).
4. **Environment variables** (Site settings → Build & deploy) :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://VOTRE-SERVICE.onrender.com/api` |

5. **Deploy site**. Tester recherche / connexion.

**Erreur 404 sur `https://votre-site.netlify.app/api/...`** : le front appelle Netlify au lieu de Render. `VITE_API_URL` ne doit **pas** être `/api` en prod — utilisez l’URL complète Render (`https://….onrender.com/api`), puis **Deploys → Trigger deploy**.

---

## 3. Admin (optionnel, 2e site Netlify)

1. **Add new site** → même repo.
2. **Base directory** : `admin` (Netlify utilise alors `admin/netlify.toml`).
3. Variable :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://VOTRE-SERVICE.onrender.com/api` |

4. Mettre à jour sur Render : `CLIENT_URL=https://votre-admin.netlify.app` puis redéployer l’API.

---

## 4. CORS

L’API autorise les origines `WEB_URL`, `CLIENT_URL`, `MOBILE_URL` et `CORS_ORIGINS` (liste séparée par des virgules). Après chaque nouveau domaine Netlify, mettez à jour Render et redéployez.

---

## 5. Google Maps

Restreignez la clé API aux domaines Netlify + localhost. Les appels Places passent par le backend (`/api/places/…`).

---

## 6. Checklist post-déploiement

- [ ] `/api/health` → 200
- [ ] Login passager / admin
- [ ] Recherche de trajets
- [ ] Autocomplete adresses (clé Google + backend)
- [ ] Neon : tables à jour (`npm run db:push` en local si le schéma change)
