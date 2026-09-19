import { SITE } from './site';

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE.url}/#business`,
  name: SITE.name,
  url: SITE.url,
  email: SITE.email,
  telephone: '+33609050001',
  founder: {
    '@type': 'Person',
    '@id': `${SITE.url}/a-propos#marion-aubreton`,
    name: SITE.owner,
    jobTitle: 'Pédagogue psychocorporelle et praticienne en sophrologie',
  },
  areaServed: SITE.areaServed.map((name) => ({
    '@type': 'AdministrativeArea',
    name,
  })),
  knowsAbout: [
    'Fly Yoga',
    'Yoga aérien',
    'Souplesse',
    'Sophrologie',
    'Régulation émotionnelle',
    'Neuroatypie',
  ],
  sameAs: [SITE.bookingProfile],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE.url}/#website`,
  url: SITE.url,
  name: SITE.name,
  inLanguage: 'fr-FR',
  publisher: { '@id': `${SITE.url}/#business` },
};

export function serviceSchema(
  name: string,
  description: string,
  path: string,
  serviceType: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType,
    url: `${SITE.url}${path}`,
    provider: { '@id': `${SITE.url}/#business` },
    areaServed: SITE.areaServed,
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}
