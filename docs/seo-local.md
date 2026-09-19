# Revue SEO local — Gao Mata

19 septembre 2026. Sources : site live `gaomata.com`, code du repo, Bottin, PlaySport, Mudita, mairie de Boisseuil, PagesJaunes / Mappy pour le 11 rue Degas.

Le levier n’est pas un article de blog : c’est l’alignement nom–adresse–téléphone entre le site live, le nouveau site, Google et les annuaires. Ces sources se contredisent au moment du déménagement vers le Chat qui Médite.

| Bloqueurs pack local | Adresse dans le schema | Lieux à déclarer | Fiches encore à Noriac |
| --- | --- | --- | --- |
| 3 | 0 | 2 | 3 |

## Position

Gao Mata est une activité locale à deux sites. Le classement « fly yoga Limoges », « sophrologue Limoges » et le pack Maps dépendent du trio NAP + fiche Google + pages lieu.

Mudita a repris les cours de Fly Yoga avec une autre professeure. Les relations sont rompues : pas d’article de départ, pas de lien, pas de désindexation à attendre. Mudita est un concurrent centre-ville. Tant que Bottin et PlaySport pinent Gao Mata au 32 rue Jules Noriac, Google envoie du trafic vers leur salle.

Enjeu : sortir Gao Mata de Noriac, verrouiller les recherches de marque, puis le sud agglomération.

## NAP aujourd’hui vs cible

| Champ | Site live | Nouveau site (code) | Citations | Cible |
| --- | --- | --- | --- | --- |
| Nom | Gao Mata / Marion Aubreton | Gao Mata | Gao Mata — Fly Yoga et Sophrothérapie | Unifier Gao Mata + Marion Aubreton |
| Téléphone | 06.09.05.00.01 | 06 09 05 00 01 / +33609050001 | +61 06 09 05 00 01 (PlaySport) | Toujours +33 6 09 05 00 01 |
| E-mail | Non visible en footer live | gao.mata87@gmail.com | gao.mata87@gmail.com | OK — garder partout |
| Adresse 1 | 32 rue Jules Noriac, 87000 Limoges | « Boisseuil » sans rue (Chat qui Médite) | 32 rue Jules Noriac (Bottin, PlaySport) | 5 allée du Château, 87260 Saint-Hilaire-Bonneval |
| Adresse 2 | Absente | 11 rue Degas, Limoges — « Éloïse Krampt » | Absente | 11 rue Degas, 87000 Limoges — Eloïse Kramp |
| Horaires | Absents du site | Lundi/samedi sophro Boisseuil ; vendredi Limoges | Horaires génériques Bottin (probablement faux) | Tableau jours × lieu, recopié en schema + GBP |

## Lieux réels à encoder

**Collectifs — lieu principal.** Le Chat qui Médite, 5 allée du Château, 87260 Saint-Hilaire-Bonneval (limitrophe Boisseuil, près du château de la Briance). Fly Yoga, souplesse, sophrologie lundi et samedi.

**Sophrologie — second lieu.** Cabinet d’Eloïse Kramp (pas Krampt), 11 rue Degas, 87000 Limoges, quartier La Brégère. Vendredis et un samedi par mois.

Google : une fiche par lieu visité régulièrement. Le Chat qui Médite en primaire. Limoges en secondaire si les vendredis sont stables. Zone desservie : Haute-Vienne, sans inventer un pin au domicile.

## Déjà en place dans le repo

Titles géolocalisés, LocalBusiness + Service + Breadcrumb, canonicals, sitemap Astro, zone desservie Boisseuil / Limoges / Haute-Vienne, section lieux sur l’accueil.

Manque pour Maps : adresse, fiche Google, carte. `LOCATIONS` écrit « Éloïse Krampt » alors que les annuaires ont Eloïse Kramp.

## Findings

| Prio | Impact | Zone | Problème | Correctif |
| --- | --- | --- | --- | --- |
| P0 | Critique | NAP / déménagement | Le site public et les citations parlent encore de Mudita, 32 rue Jules Noriac. Le nouveau site vise Boisseuil + 11 rue Degas. Mudita a remplacé les cours : c’est un concurrent, pas un relais. | Lancer le nouveau site avec adresses exactes, puis corriger GBP, Bottin et PlaySport. Ne rien demander à Mudita. |
| P0 | Critique | Schema LocalBusiness | Le JSON-LD n’a ni address, ni geo, ni horaires, ni image, ni logo. Google ne peut pas relier l’entité à un lieu. | Compléter LocalBusiness (ou SportsActivityLocation + HealthAndBeautyBusiness) avec PostalAddress, GeoCoordinates, openingHours, image, priceRange. |
| P0 | Critique | Fiche Google | Aucune fiche Google Business Profile alignée sur les nouveaux lieux. Sans elle, le pack local reste inaccessible. | Créer ou migrer une fiche au Chat qui Médite, éventuellement une 2e pour le cabinet Limoges. |
| P1 | Élevé | Géographie | Le site dit « Boisseuil » alors que Le Chat qui Médite est au 5 allée du Château, 87260 Saint-Hilaire-Bonneval. | Écrire « Saint-Hilaire-Bonneval, à la lisière de Boisseuil » partout : contenu, schema, GBP, footer. |
| P1 | Élevé | NAP visible | Footer = villes + tél + mail. Mentions légales sans adresse. Pas de carte, pas d’accès, pas d’horaires structurés. | Bloc NAP complet sur chaque page (footer) + page Lieux avec carte, parking, bus, jours par site. |
| P1 | Élevé | Citations | PlaySport a le téléphone +61 06 09 05 00 01, une fausse catégorie « centre de retraite », et l’ancienne adresse. Bottin.fr idem. | Corriger ou supprimer ces fiches. Ajouter Instagram, Facebook et LinkedIn dans sameAs. |
| P1 | Élevé | Migration URL | Live : `/fly-yoga`, `/sophrotherapie`, Eversports, pas de canonical ni sitemap. `gaomata.fr` répond 500. | 301 `/fly-yoga` → `/fly-yoga-souplesse`, `/sophrotherapie` → `/sophrologie-neuroatypie`. Rediriger `.fr` → `.com`. Soumettre le sitemap. |
| P2 | Moyen | Pages lieux | Une section accueil trop mince. Pas de page par lieu. | Page `/lieux`, puis renforcer les deux pages offres avec un bloc lieu unique (pas de doorway pages vides). |
| P2 | Moyen | On-page | Titres du nouveau site sont bons. Les H1 restent poétiques, sans ville. Live : titre identique sur toutes les pages, 2 H1. | Garder les titles géolocalisés. Glisser la ville dans le H1 ou le premier paragraphe visible. |
| P2 | Moyen | Schema secondaire | FAQ visibles sans FAQPage. Tarifs sans Offer. sameAs = seulement Aurarios. Typo « Krampt ». | FAQPage + Offer. sameAs vers Insta / FB / LinkedIn / GBP. Corriger Eloïse Kramp. |
| P3 | Levier | Concurrent Mudita | Mudita garde « Fly Yoga Limoges » avec une autre prof. La page portrait Marion y est encore. Un article de départ est mort. | Gagner les requêtes de marque (Gao Mata, Marion, fly yoga Marion). Désambiguïser sur `/a-propos` sans les citer. Liens Chat qui Médite, Climb Up, mairie seulement. |
| P3 | Levier | Avis & fraîcheur | Témoignages on-site anonymes. Pas d’avis Google, pas de photos de façade/intérieur géolocalisées. | Collecter des avis GBP après chaque séance. Publier 10+ photos des deux salles. Posts Google hebdo. |

## Plan d’action

1. **Cette semaine — geler le NAP canonique.** Décider le lieu principal GBP, l’adresse exacte SHB, et le libellé Boisseuil vs Saint-Hilaire-Bonneval.
2. **Avant mise en ligne — schema + footer + mentions.** address, geo, image, logo, horaires, priceRange, sameAs, FAQPage. Corriger Kramp.
3. **Jour J — 301 + Search Console.** Anciennes URLs, `gaomata.fr` → `www.gaomata.com`, soumettre `sitemap-index.xml`.
4. **Jour J + 1 — fiche Google.** Catégories : studio de yoga + sophrologue. Services, zones (87), photos, lien du site, planning.
5. **Semaine 2 — nettoyer les citations.** PlaySport, Bottin, PagesJaunes, Apple Maps, Bing Places. Sortir Gao Mata de l’adresse Noriac. Rien à demander à Mudita.
6. **Semaine 2 — page Lieux.** Deux fiches : accès, parking, jours, ce qui s’y pratique. Carte + itinéraire. Lien depuis le footer.
7. **30 jours — avis et liens locaux.** 10 avis GBP. Liens Chat qui Médite, Climb Up, mairie. Page Fly : lieu actuel + proximité Limoges, sans nommer Mudita.

## Mots-clés locaux

Mudita gardera le centre-ville. Gao Mata doit verrouiller la marque et le sud agglomération, puis gratter « fly yoga Limoges » sur l’entité Marion, pas sur l’adresse Noriac.

| Requête | Intent | Page cible | Note |
| --- | --- | --- | --- |
| fly yoga Limoges | Cours | `/fly-yoga-souplesse` | Concurrent en centre-ville. Viser proximité Limoges + lieu SHB, sans les citer. |
| yoga aérien Limoges | Cours | `/fly-yoga-souplesse` | Synonyme à placer dans un H2, pas à stuffing dans le title. |
| sophrologue Limoges | RDV | `/sophrologie-neuroatypie` | Title actuel déjà bon. Ajouter 11 rue Degas + horaires vendredi. |
| sophrologue TDAH / neuroatypie Limoges | Niche | `/sophrologie-neuroatypie` | Différenciateur réel. Garder TDAH, TSA, DYS, HPI. |
| fly yoga Boisseuil / Saint-Hilaire-Bonneval | Cours local | `/fly-yoga-souplesse` + `/lieux` | Volume plus bas, conversion plus haute. Nommer les deux communes. |
| cours de souplesse Limoges | Cours | `/fly-yoga-souplesse` | Peu concurrentiel. Un H2 + tarif essai 12 € suffisent. |

## Non vérifié

Pas d’accès Search Console ni à une fiche Google éventuelle sous un autre nom. Le `site:gaomata.com` via recherche web n’a rien renvoyé : à confirmer dans GSC après mise en ligne. Horaires exacts à valider avec Marion avant de les figer dans le schema.
