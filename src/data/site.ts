/**
 * Réglages techniques du site. Les textes et coordonnées éditables vivent
 * dans src/cms/schema.ts et se lisent avec `getContent()`.
 */
export const SITE = {
  name: 'Gao Mata',
  owner: 'Marion Aubreton',
  url: 'https://www.gaomata.fr',
  bookingOrigin: 'https://www.aurarios.fr',
  collectiveEmbed: 'https://www.aurarios.fr/embed/gao-mata?view=liste',
  sophrologyEmbed: 'https://www.aurarios.fr/embed/gao-mata/prestations',
  areaServed: ['Boisseuil', 'Limoges', 'Haute-Vienne'],
} as const;
