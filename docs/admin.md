# Espace admin : mise en service sur Cloudflare

L'admin (`https://www.gaomata.fr/admin`, lien « Espace admin » en bas de chaque
page) permet de modifier tous les textes du site et de publier des ateliers.
Le site reste statique : chaque enregistrement relance un build Workers
Builds, qui relit la base D1 puis redéploie le Worker.

```
Admin (/admin) ──► Worker gaomata-com : /api/admin ──► D1 gao-mata-cms
                                     │              └► R2 gao-mata-media (photos, /media/*)
                                     └► Deploy hook ──► Workers Builds
                                                        npm run build (lit D1) ──► wrangler deploy
```

Compte Cloudflare : `davidbarbi3r@gmail.com` (Account ID
`f74d1954e4a02e96d253e4dd286371b9`). Le Worker `gaomata-com` sert déjà
gaomata.fr et www.gaomata.fr ; `wrangler.jsonc` reprend ces domaines.

## État de la mise en service (14/10/2026)

| Étape                                                  | État                        |
| ------------------------------------------------------ | --------------------------- |
| Base D1 `gao-mata-cms` (Europe de l'Ouest) + tables    | ✅ fait                     |
| Stockage R2 `gao-mata-media` (privé)                   | ✅ fait                     |
| Deploy hook `admin-cms` (branche `main`)               | ✅ fait                     |
| Zero Trust Free, équipe `davidbarbier`                 | ✅ fait                     |
| Application Access « Admin Gao Mata » + code par email | ✅ fait                     |
| Secret de build `CMS_API_TOKEN`                        | ⏳ à faire                  |
| Droits D1 / R2 du jeton de déploiement Workers Builds  | ⏳ à vérifier               |
| Secret du Worker `DEPLOY_HOOK_URL`                     | ⏳ après le 1er déploiement |

## 1. Base D1 et stockage des photos (fait)

- D1 `gao-mata-cms`, id `b0584e84-f35c-4bcc-9b3b-601633ef6680` (déjà dans
  `wrangler.jsonc`). Tables créées depuis la console D1, migration
  `0001_cms.sql` enregistrée comme appliquée.
- R2 `gao-mata-media`, privé : les photos sont servies par le Worker sur
  `/media/*`.

Migrations suivantes : `npm run db:migrate:remote`. Si wrangler répond
« not authorized » (code 7403), relancer `npx wrangler login`, ou exécuter le
SQL dans la console D1 du tableau de bord.

## 2. Workers Builds (déploiement depuis Git)

Worker `gaomata-com` → Paramètres → Builds (déjà en place) : dépôt
`davidbarbi3r/gaomata.com`, branche `main`, build `npm run build`, déploiement
`npx wrangler deploy`.

`wrangler.jsonc` fournit le reste : point d'entrée `worker/index.ts`, fichiers
`dist/`, domaines, liaisons D1 / R2 et variables non secrètes.

À vérifier : le jeton de déploiement utilisé par Workers Builds (« API
token », actuellement `le-chat-qui-medite`) doit pouvoir déployer un Worker
lié à D1 et R2. Si le premier déploiement échoue sur une erreur d'autorisation,
créer un jeton dédié (modèle « Edit Cloudflare Workers » + D1 Edit + R2 Edit)
et le sélectionner dans ce champ.

## 3. Secret de build `CMS_API_TOKEN` (à faire)

Le build lit D1 via l'API Cloudflare. Créer un jeton (Mon profil → Jetons
d'API → Créer un jeton personnalisé) avec seulement **Compte → D1 → Lecture**.

L'ajouter dans Worker → Paramètres → Builds → **Variables et secrets de
build**, comme secret `CMS_API_TOKEN`. (Ce n'est pas un secret d'exécution :
le Worker n'en a pas besoin.)

Au premier déploiement, le journal du build doit afficher
`[cms] Source du contenu : d1`. Sinon, le build s'arrête avec un message
explicite, et la version en ligne reste inchangée.

## 4. Deploy hook (créé, secret à poser après le 1er déploiement)

Le hook `admin-cms` existe (Worker → Paramètres → Builds → Deploy Hooks).
Tant que le Worker ne sert que des fichiers statiques, Cloudflare refuse les
secrets : après le premier déploiement de ce code, copier l'URL du hook et :

```bash
npx wrangler secret put DEPLOY_HOOK_URL
```

Sans ce secret, les modifications sont enregistrées, mais n'apparaissent
qu'au prochain déploiement. Si un build est déjà en attente, Cloudflare ne le
duplique pas.

## 5. Connexion des admins (Cloudflare Access, fait)

- Zero Trust Free sur le compte, domaine d'équipe
  `https://davidbarbier.cloudflareaccess.com` (commun à tous les sites du
  compte : chaque site a sa propre application Access).
- Application **Admin Gao Mata** : destinations `www.gaomata.fr/admin`,
  `www.gaomata.fr/api/admin`, `gaomata.fr/admin`, `gaomata.fr/api/admin`.
- Règle **Admins Gao Mata** : Allow, Emails = `gao.mata87@gmail.com`,
  `davidbarbi3r@gmail.com`.
- Connexion : code reçu par email (One-time PIN), ou compte Cloudflare.
- `ACCESS_TEAM_DOMAIN` et `ACCESS_AUD` (Application Audience Tag, non secret)
  sont dans `wrangler.jsonc`.

Le Worker vérifie lui-même la signature du jeton Access et l'email (liste
`ADMIN_EMAILS` de `wrangler.jsonc`) : sur une adresse non protégée par Access
(ex. `*.workers.dev`), l'API refuse tout simplement.

Ajouter ou retirer un admin = modifier la règle Access **et** `ADMIN_EMAILS`.

## Récapitulatif

| Nom                     | Où                                   | Rôle                              |
| ----------------------- | ------------------------------------ | --------------------------------- |
| `database_id`           | `wrangler.jsonc`                     | Base D1 (Worker et build)         |
| `CLOUDFLARE_ACCOUNT_ID` | `wrangler.jsonc`                     | Compte, lu par le build           |
| `ADMIN_EMAILS`          | `wrangler.jsonc`                     | Comptes autorisés                 |
| `ACCESS_TEAM_DOMAIN`    | `wrangler.jsonc`                     | Vérification du jeton Access      |
| `ACCESS_AUD`            | `wrangler.jsonc`                     | Vérification du jeton Access      |
| `CMS_API_TOKEN`         | secret **de build** (Workers Builds) | Lecture D1 au build               |
| `DEPLOY_HOOK_URL`       | secret du Worker                     | Rebuild après chaque modification |
| `DEV_ADMIN_EMAIL`       | `.dev.vars` (local)                  | Admin simulé, localhost seulement |

Vérifier la configuration sans rien publier :

```bash
npm run build && npx wrangler deploy --dry-run --outdir .wrangler/dry-run
```

## Utilisation au quotidien

- **Textes du site** : menu de gauche, une entrée par page du site (plus
  « Éléments communs » et « Pages des ateliers »). Chaque champ indique où il
  apparaît ; « Rétablir le texte d'origine » annule une modification.
  « Enregistrer et publier » met le site à jour en deux à trois minutes.
- **Ateliers** : « Nouvel atelier », remplir l'essentiel (titre, date, lieu),
  la photo, le résumé et la présentation. « Enregistrer le brouillon » garde
  l'atelier invisible ; « Publier sur le site » l'ajoute à la page d'accueil et
  crée sa page `/ateliers/…`. Un atelier passé disparaît tout seul de
  l'accueil ; sa page reste en ligne avec la mention « atelier passé ».
- Les photos qui ne servent plus (remplacées, retirées, atelier abandonné)
  sont supprimées automatiquement après 24 h.
- Si une modification n'apparaît pas après quelques minutes, cliquer
  « Republier » en haut de l'admin, puis regarder le journal du build dans
  Workers Builds si besoin.
