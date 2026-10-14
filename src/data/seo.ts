import { phoneHref } from '../cms/format';
import type { Content } from '../cms/schema';
import { workshopPath, type Workshop } from '../cms/workshops';
import { SITE } from './site';

export const localBusinessSchema = (contact: Content['commun']['contact']) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE.url}/#business`,
  name: SITE.name,
  url: SITE.url,
  email: contact.email,
  telephone: phoneHref(contact.phone).replace('tel:', ''),
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
  sameAs: [contact.bookingProfile],
});

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

/** Décalage horaire de Paris à une date donnée, ex. « +01:00 ». */
function parisOffset(date: string) {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    timeZoneName: 'longOffset',
  })
    .formatToParts(new Date(`${date}T12:00:00Z`))
    .find((part) => part.type === 'timeZoneName')?.value;
  return name?.replace('GMT', '') || '+01:00';
}

const eventDate = (date: string, time: string) =>
  time ? `${date}T${time}:00${parisOffset(date)}` : date;

export function eventSchema(
  workshop: Pick<
    Workshop,
    | 'slug'
    | 'title'
    | 'summary'
    | 'startsOn'
    | 'endsOn'
    | 'startTime'
    | 'endTime'
    | 'location'
    | 'price'
    | 'bookingUrl'
  > & { image?: string },
) {
  const url = `${SITE.url}${workshopPath(workshop.slug)}`;
  const amount = workshop.price
    .match(/\d+(?:[.,]\d+)?/)?.[0]
    ?.replace(',', '.');
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: workshop.title,
    description: workshop.summary,
    url,
    image: workshop.image ? [workshop.image] : undefined,
    startDate: eventDate(workshop.startsOn, workshop.startTime),
    endDate: eventDate(
      workshop.endsOn || workshop.startsOn,
      workshop.endTime || (workshop.endsOn ? '' : workshop.startTime),
    ),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: workshop.location,
      address: workshop.location,
    },
    organizer: { '@id': `${SITE.url}/#business` },
    offers: amount
      ? {
          '@type': 'Offer',
          price: amount,
          priceCurrency: 'EUR',
          url: workshop.bookingUrl || url,
          availability: 'https://schema.org/InStock',
        }
      : undefined,
  };
}
