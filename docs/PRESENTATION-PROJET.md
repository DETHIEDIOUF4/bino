<p align="center">
  <img src="./brand/bino-logo-principal.svg" alt="bino" width="340" />
</p>

---

## C’est quoi bino ?

**bino** est un **site web de covoiturage du quotidien** : des personnes qui vont au même endroit (travail, école, quartier…) peuvent **partager une ride** et **se partager les frais** (en général entre 4 $ et 10 $).

Il y a deux types d’utilisateurs :

- **Passagers** : cherchent un trajet et réservent une place.
- **Conducteurs** : proposent un trajet avec des places libres dans leur voiture.

**Important :** avant de conduire pour les autres, un conducteur doit **s’inscrire** et être **approuvé par l’administration** (permis, véhicule).

---

## Le site à retenir

| Quoi | Lien |
|------|------|
| **Site public bino** (tout le monde) | **https://binoa.netlify.app** |
| **Espace administration** (vous et votre équipe) | **https://binoa.netlify.app/adminbino** |

Gardez ces deux adresses : la première pour les clients, la seconde pour **gérer** la plateforme.

---

## Comment un passager utilise bino

1. Ouvrir **https://binoa.netlify.app**
2. Cliquer sur **Rechercher** (ou aller sur « Rechercher un trajet »).
3. Indiquer **d’où** et **où** il va (ex. Université Laval → Sainte-Foy).
4. Voir les trajets disponibles et **réserver**.
5. S’il n’y a pas de trajet, il peut **demander un trajet** ; un conducteur pourra accepter plus tard.
6. La première fois qu’il réserve, il **crée un compte** (courriel + mot de passe).

Pages utiles :

- Recherche : **https://binoa.netlify.app/rechercher**
- Créer un compte passager : **https://binoa.netlify.app/inscription**
- Se connecter : **https://binoa.netlify.app/connexion**

---

## Comment un conducteur utilise bino

1. Ouvrir **https://binoa.netlify.app/partager-ma-voiture**
2. Remplir le trajet qu’il veut proposer.
3. **S’inscrire comme conducteur** (coordonnées, permis, infos véhicule).
4. **Attendre la validation** de l’équipe admin (voir section admin ci-dessous).
5. Une fois **approuvé**, il peut publier des trajets et recevoir des demandes de passagers.

Page d’inscription conducteur : **https://binoa.netlify.app/inscription-conducteur**

---

## Espace administration — votre outil de gestion

C’est **ici** que vous (ou une personne de confiance) :

- **validez ou refusez** les nouveaux conducteurs ;
- voyez les **chiffres** (nombre d’utilisateurs, trajets, etc.) ;
- consultez **passagers et conducteurs** ;
- **désactivez** un compte si besoin ;
- **modifiez ou supprimez** un trajet publié.

### Se connecter

1. Aller sur **https://binoa.netlify.app/adminbino**
2. Entrer le **courriel** et le **mot de passe** (tableau ci-dessous).
3. Cliquer **Se connecter**.

### Menus (une fois connectée)

| Menu | À quoi ça sert |
|------|----------------|
| **Tableau de bord** | Vue d’ensemble : utilisateurs, conducteurs, trajets, kilomètres partagés |
| **Validation conducteurs** | Liste des conducteurs en attente → **Valider** ou **Refuser** |
| **Passagers & conducteurs** | Liste des comptes → **Suspendre** ou **Réactiver** si problème |
| **Trajets** | Tous les trajets publiés → corriger ou supprimer si erreur |

### Comptes administration à utiliser

**À transmettre uniquement à des personnes de confiance.**  
Il est recommandé de **changer les mots de passe** après la première connexion.

| Qui | Courriel | Mot de passe |
|-----|----------|--------------|
| **Administrateur principal** (accès complet) | admin.general@aidafall.ca | BinoAdmin2026! |
| **Administrateur de secours** | admin@aidafall.ca | Admin123! |
| **Agent** (validation conducteurs seulement, pas tout le reste) | agent@aidafall.ca | Agent123! |

L’**administrateur principal** est celui à utiliser au quotidien pour tout gérer.

L’**agent** convient à quelqu’un qui ne fait que **approuver les conducteurs**, sans toucher aux trajets ni aux statistiques globales.

---

## Comptes de démonstration (tests)

Pour **essayer** le site comme un client, sans toucher à l’admin :

| Rôle | Courriel | Mot de passe |
|------|----------|--------------|
| Passager test | passager.test@aidafall.ca | Test1234! |
| Conducteur test (déjà approuvé en demo) | marie.conducteur@test.aidafall.ca | Test1234! |

Ces comptes servent à **montrer** le site ; ce ne sont pas les comptes de gestion.

---

## Ce que vous devez savoir (sans technique)

- **Le site** (binoa.netlify.app) est hébergé en ligne : pas besoin d’installer quoi que ce soit sur un ordinateur pour l’utiliser.
- **Les données** (comptes, trajets) sont stockées de façon sécurisée dans le cloud.
- **Les mots de passe admin** ci-dessus sont sensibles : ne les mettez pas sur les réseaux sociaux.
- Si le site ne répond plus ou si la connexion admin échoue, contactez la **personne technique** qui gère le projet (Render, Netlify, base de données).

Vous n’avez **pas besoin** de comprendre GitHub, Neon ou Render pour **utiliser** bino au quotidien : seulement le **site** et **/adminbino**.

---

## En résumé — une page

| | |
|---|---|
| **Site clients** | https://binoa.netlify.app |
| **Gestion (admin)** | https://binoa.netlify.app/adminbino |
| **Login admin recommandé** | admin.general@aidafall.ca / BinoAdmin2026! |
| **Action la plus fréquente** | Valider les nouveaux conducteurs dans « Validation conducteurs » |
| **Passager** | Recherche → réserve → compte si besoin |
| **Conducteur** | Inscription → **attente validation admin** → publie des trajets |

---

*bino — covoiturage quotidien · document pour la propriétaire du projet*
