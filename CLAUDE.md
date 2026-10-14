# CLAUDE.md — Gao Mata

Site vitrine de Gao Mata (Marion Aubreton) : Fly Yoga, souplesse, sophrologie.
Astro 7 en rendu **statique**, servi par le **Worker Cloudflare `gaomata-com`**
(fichiers statiques + petite API), déployé par Workers Builds depuis Git. Un
espace admin (`/admin`) modifie les textes et publie des ateliers.

Langue : le contenu, les messages d'interface et les commentaires sont en
français, en tutoiement côté visiteur comme côté admin.

## Architecture du contenu (à lire avant toute modification)

```
src/cms/schema.ts     Tous les textes du site + leurs textes d'origine (page → section → champ)
src/cms/fields.ts     Types de champs (text, textarea, url, email, list) + validation
src/cms/workshops.ts  Modèle des ateliers (validation, dates, slug) partagé build/admin/API
src/cms/load.ts       Build : lit D1 (textes modifiés + ateliers publiés), sinon textes d'origine
src/cms/publish.ts    Contrat de publication partagé admin / Worker
src/admin/            Application admin (Preact, chargée sur /admin)
worker/               Worker : routeur (index.ts), API /api/admin/*, photos /media/*
wrangler.jsonc        Worker, domaines, D1 (binding DB), R2 (MEDIA), variables
migrations/           Schéma SQL de la base D1 `gao-mata-cms`
```

Flux : l'admin enregistre dans D1 → le Worker appelle le deploy hook Workers
Builds → le build relit D1, régénère le site statique et `wrangler deploy` le
publie (2 à 3 minutes). Le Worker ne s'exécute d'abord que pour `/api/*` et
`/media/*` (`assets.run_worker_first`) ; tout le reste est servi en statique.

D1 ne stocke que les textes **différents** du texte d'origine. Changer un texte
d'origine dans `schema.ts` met donc le site à jour, sauf si l'admin a modifié ce
champ (sa version gagne).

## Règles de maintenance (obligatoires)

1. **Aucun texte éditorial en dur dans les pages.** Tout texte visible par un
   visiteur (titres, paragraphes, boutons, légendes, descriptions de photos,
   listes, tarifs, FAQ…) se déclare dans `src/cms/schema.ts` et se lit avec
   `const content = await getContent()`. Seuls les micro-textes techniques
   (états de chargement, libellés d'accessibilité, mentions du module
   Aurarios) peuvent rester dans le code.
2. **Ajouter un texte** : ajouter le champ dans la bonne section de
   `schema.ts`, avec un libellé et, si utile, une aide (`help`) compréhensibles
   par Marion, qui n'est pas développeuse. Puis l'afficher dans la page.
   L'admin génère le formulaire tout seul.
3. **Ajouter une page** : une nouvelle entrée `page(...)` dans `schema.ts`
   (avec son `path`) apparaît automatiquement dans le menu de l'admin.
4. **Renommer ou supprimer un champ** change sa clé de stockage
   (`page.section.champ`) : une éventuelle modification faite dans l'admin est
   alors ignorée (le build l'écrit dans les logs). Prévenir l'utilisateur, et
   si besoin reporter la valeur de D1 dans le nouveau texte d'origine
   (`wrangler d1 execute gao-mata-cms --remote --command "SELECT * FROM content"`).
5. **Listes** : utiliser `list(...)` avec `itemTitle` (titre affiché dans
   l'admin) ; chaque élément d'origine doit avoir exactement les sous-champs
   déclarés (vérifié par `tests/cms.spec.ts`).
6. **Rendu des textes** : `<Lines text={…} />` pour respecter les retours à la
   ligne, `toParagraphs()` pour les textes à plusieurs paragraphes,
   `<BrandText />` quand le nom « Gao Mata » peut apparaître. Rendre les `<p>`
   directement dans la page (les styles Astro sont limités au composant).
7. **Ateliers** : toute nouvelle donnée d'atelier = colonne dans une nouvelle
   migration `migrations/000X_*.sql` + entrée dans `WORKSHOP_COLUMNS`
   (`src/cms/workshops.ts`, les types et le SQL en découlent) + règle dans
   `validateWorkshop()` + champ du formulaire `src/admin/Workshops.tsx` +
   affichage. Un champ en HTML d'éditeur va aussi dans `RICH_TEXT_FIELDS`.
   Ne jamais modifier une migration déjà appliquée.
8. **HTML des ateliers** : il vient de l'éditeur et passe par
   `sanitizeRichText()` (liste blanche) au build. Ne jamais afficher de HTML
   venant de D1 sans ce filtre.
9. **Sécurité de l'API** : toute route d'écriture se déclare dans
   `ADMIN_ROUTES` (`worker/index.ts`), qui passe par `authenticate()` (jeton
   Cloudflare Access vérifié + liste `ADMIN_EMAILS` de `wrangler.jsonc`, seule
   source des comptes autorisés) et par le contrôle d'origine. Ne pas créer de
   route d'écriture ailleurs. Les photos acceptées sont celles de `COVER_KEY`.
10. Après une modification du contenu ou du système : `npm run check`,
    `npm run lint`, `npm run build`, `npm run test`, et mettre à jour ce
    fichier et `docs/admin.md` si le fonctionnement change.

## Commandes

```bash
npm run dev            # site seul, textes d'origine, sans admin
npm run dev:admin      # site + admin + D1/R2 locales sur http://localhost:8788/admin
npm run build          # vérifications TypeScript + build statique
npm run check          # astro check + types du Worker
npm run lint
npm run test           # Playwright (site) + tests du modèle de contenu
npm run db:migrate:local / db:migrate:remote
```

`npm run dev:admin` reconstruit le site à chaque enregistrement dans l'admin,
comme en production. L'email simulé vient de `.dev.vars` (créé depuis
`.dev.vars.example`) ; il n'est accepté que sur localhost.

Source du contenu au build (`CMS_SOURCE`) : `d1` (production), `local`
(`dev:admin`), `defaults`. Un build Workers Builds (`WORKERS_CI`) sans accès à
D1 échoue volontairement, pour ne jamais republier les textes d'origine
par-dessus les modifications. Vérifier un déploiement sans rien publier :
`npx wrangler deploy --dry-run --outdir .wrangler/dry-run`.

## Admin

- Comptes autorisés : `ADMIN_EMAILS` dans `wrangler.jsonc`
  (gao.mata87@gmail.com, davidbarbi3r@gmail.com), plus la règle Cloudflare
  Access correspondante.
- Accès : lien « Espace admin » en bas de chaque page (pied de page).
- Mise en service et configuration Cloudflare : `docs/admin.md`.
- L'interface vise une utilisatrice non technique : libellés en français
  simple, aide sous les champs, confirmation avant suppression, avertissement
  avant de quitter sans enregistrer. Garder ce niveau d'exigence.
