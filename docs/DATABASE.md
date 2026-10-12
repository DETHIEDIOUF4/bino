# Base de données

AidaFALL utilise **PostgreSQL** avec **Prisma** ([Neon](https://neon.tech) recommandé en cloud).

## Neon (prod / démo)

1. Créez un projet sur [Neon](https://neon.tech).
2. Créez une base (ex. `aidafall`) ou utilisez la base `neondb` par défaut.
3. Copiez la **connection string** (onglet *Connect* → *Pooled connection* pour l’API Node).
4. Ajoutez-la dans `backend/.env` :

```env
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/aidafall?sslmode=require
```

5. Appliquez le schéma :

```bash
cd backend
npm run db:push
# ou migrations versionnées :
npm run db:migrate
```

6. Redémarrez le backend (`npm run dev`). Au premier démarrage, `seedAdmin` crée admin / agent / municipalité démo.

7. Données de test (optionnel) : `npm run seed`

## Développement local

Installez PostgreSQL localement, puis :

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/aidafall
```

```bash
cd backend
npm run db:push
npm run dev
```

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `npm run postinstall` | Génère le client Prisma |
| `npm run db:push` | Synchronise le schéma sans fichier de migration |
| `npm run db:migrate` | `prisma migrate dev` (historique de migrations) |
| `npm run seed` | Comptes et trajets de test pour le matching |

## Variables d’environnement

- **`DATABASE_URL`** (requis) — chaîne PostgreSQL complète, avec `?sslmode=require` sur Neon.
