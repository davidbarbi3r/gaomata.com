# Gao Mata

Site officiel de Gao Mata, construit avec Astro. Le projet présente les
activités de Fly Yoga, souplesse et sophrologie à Boisseuil et Limoges.

## Développement

Prérequis : Node.js 22 et npm.

```bash
npm install
npm run dev
```

Le serveur local est disponible sur `http://localhost:4321`.

## Commandes

- `npm run dev:admin` : site + espace admin avec base locale, sur
  `http://localhost:8788/admin`

- `npm run check` : validation Astro et TypeScript
- `npm run lint` : analyse ESLint
- `npm run format:check` : contrôle du formatage
- `npm run build` : contrôle TypeScript puis production statique
- `npm run test` : parcours Playwright et audits axe
- `npm run verify` : suite de validation complète

## Contenu et configuration

- Tous les textes du site (et leurs textes d’origine) sont déclarés dans
  `src/cms/schema.ts`. Ils se modifient depuis l’espace admin (`/admin`),
  qui enregistre dans Cloudflare D1 ; le build relit D1.
- Les ateliers se créent uniquement depuis l’admin (D1 + photos dans R2).
- Les réglages techniques (URL, modules Aurarios) vivent dans
  `src/data/site.ts`.
- Les photos sources vivent dans `src/assets/images`.
- Mise en service de l’admin : `docs/admin.md`. Règles de maintenance :
  `CLAUDE.md`.

La page Réserver charge le widget Aurarios correspondant après le choix entre
cours collectifs et sophrologie. Les pages d’offres affichent directement leur
widget dédié. Les mentions légales et informations de confidentialité vivent
sur la route utilitaire `/mentions-legales`, exclue du sitemap marketing.
