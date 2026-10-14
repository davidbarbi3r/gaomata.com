/**
 * Modèle des ateliers, partagé entre le build, l'admin et l'API.
 * Les ateliers vivent uniquement dans D1 (table `workshops`).
 *
 * Ajouter un champ : une colonne dans une nouvelle migration, une entrée dans
 * WORKSHOP_COLUMNS, sa règle dans validateWorkshop(), puis le formulaire
 * (src/admin/Workshops.tsx) et l'affichage. Le reste en découle.
 */

/** Champ éditable → colonne de la table D1 `workshops`. */
export const WORKSHOP_COLUMNS = {
  slug: 'slug',
  status: 'status',
  title: 'title',
  /** Date de début, `AAAA-MM-JJ`. */
  startsOn: 'starts_on',
  /** Date de fin pour un atelier sur plusieurs jours, `AAAA-MM-JJ`. */
  endsOn: 'ends_on',
  /** Heures au format `HH:MM`, optionnelles. */
  startTime: 'start_time',
  endTime: 'end_time',
  location: 'location',
  price: 'price',
  /** Résumé court affiché sur les cartes de la page d'accueil. */
  summary: 'summary',
  /** Textes mis en forme (HTML produit par l'éditeur). */
  bodyHtml: 'body_html',
  programHtml: 'program_html',
  bookingUrl: 'booking_url',
  /** Texte du bouton ; vide = texte par défaut de la page atelier. */
  bookingLabel: 'booking_label',
  /** Clé de la photo dans R2, servie sur `/media/<clé>`. */
  coverKey: 'cover_key',
  coverAlt: 'cover_alt',
} as const;

type Field = keyof typeof WORKSHOP_COLUMNS;
type Column = (typeof WORKSHOP_COLUMNS)[Field];

/** Champs dont la valeur est du HTML d'éditeur (nettoyé au build). */
export const RICH_TEXT_FIELDS = ['bodyHtml', 'programHtml'] as const;

export type WorkshopStatus = 'draft' | 'published';

export type WorkshopInput = Record<Exclude<Field, 'status'>, string> & {
  status: WorkshopStatus;
};

export type Workshop = WorkshopInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

/** Ligne brute de la table D1 `workshops`. */
export type WorkshopRow = Record<
  Column | 'id' | 'created_at' | 'updated_at' | 'updated_by',
  string
>;

export const SUMMARY_MAX = 220;

const FIELDS = Object.keys(WORKSHOP_COLUMNS) as Field[];

export const emptyWorkshop = (): WorkshopInput => ({
  ...(Object.fromEntries(FIELDS.map((field) => [field, ''])) as Record<
    Field,
    string
  >),
  status: 'draft',
});

/** Champs éditables d'un atelier (sans identifiant ni dates techniques). */
export const toWorkshopInput = (workshop: Workshop): WorkshopInput => ({
  ...emptyWorkshop(),
  ...(Object.fromEntries(
    FIELDS.map((field) => [field, workshop[field]]),
  ) as WorkshopInput),
});

export function workshopFromRow(row: WorkshopRow): Workshop {
  const input = Object.fromEntries(
    FIELDS.map((field) => [field, String(row[WORKSHOP_COLUMNS[field]] ?? '')]),
  ) as Record<Field, string>;
  return {
    ...input,
    status: row.status === 'published' ? 'published' : 'draft',
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

/** Paires colonne / valeur, dans l'ordre de WORKSHOP_COLUMNS, pour le SQL. */
export const workshopColumnValues = (input: WorkshopInput) =>
  FIELDS.map((field) => ({
    column: WORKSHOP_COLUMNS[field],
    value: input[field],
  }));

/** Garde uniquement les champs connus, en texte, sans espaces superflus. */
export function cleanWorkshopInput(raw: unknown): WorkshopInput | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const source = raw as Record<string, unknown>;
  const rich: readonly string[] = RICH_TEXT_FIELDS;
  const input = Object.fromEntries(
    FIELDS.map((field) => {
      const value = typeof source[field] === 'string' ? source[field] : '';
      return [field, rich.includes(field) ? value : value.trim()];
    }),
  ) as Record<Field, string>;
  return {
    ...input,
    status: input.status === 'published' ? 'published' : 'draft',
    slug: slugify(input.slug || input.title),
  };
}

export const workshopPath = (slug: string) => `/ateliers/${slug}`;
export const mediaPath = (key: string) => `/media/${key}`;

/** Les photos sont envoyées par l'admin en JPEG, sous une clé aléatoire. */
export const COVER_KEY = /^ateliers\/\d{4}\/[0-9a-f-]{36}\.jpg$/;

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

const isHttpUrl = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export type WorkshopErrors = Partial<Record<Field, string>>;

/**
 * Règles de validation d'un atelier. Un brouillon peut être incomplet ;
 * un atelier publié doit avoir tout ce qui s'affiche sur le site.
 */
export function validateWorkshop(input: WorkshopInput): WorkshopErrors {
  const errors: WorkshopErrors = {};
  const publishing = input.status === 'published';

  if (!input.title.trim()) errors.title = 'Le titre est obligatoire.';
  if (input.title.length > 120) errors.title = '120 caractères maximum.';

  if (!input.slug || slugify(input.slug) !== input.slug) {
    errors.slug =
      'Adresse invalide : lettres minuscules, chiffres et tirets uniquement.';
  }

  if (input.startsOn && !DATE.test(input.startsOn)) {
    errors.startsOn = 'Date invalide.';
  } else if (publishing && !input.startsOn) {
    errors.startsOn = 'La date est obligatoire pour publier.';
  }
  if (input.endsOn) {
    if (!DATE.test(input.endsOn)) errors.endsOn = 'Date invalide.';
    else if (input.startsOn && input.endsOn < input.startsOn) {
      errors.endsOn = 'La date de fin est avant la date de début.';
    }
  }
  if (input.startTime && !TIME.test(input.startTime)) {
    errors.startTime = 'Heure invalide.';
  }
  if (input.endTime && !TIME.test(input.endTime)) {
    errors.endTime = 'Heure invalide.';
  }

  if (publishing && !input.location.trim()) {
    errors.location = 'Le lieu est obligatoire pour publier.';
  }
  if (publishing && !input.summary.trim()) {
    errors.summary = 'Le résumé est obligatoire pour publier.';
  }
  if (input.summary.length > SUMMARY_MAX) {
    errors.summary = `${SUMMARY_MAX} caractères maximum.`;
  }
  if (input.coverKey && !COVER_KEY.test(input.coverKey)) {
    errors.coverKey = 'Photo invalide, renvoie-la.';
  } else if (publishing && !input.coverKey) {
    errors.coverKey = 'Ajoute une photo de couverture pour publier.';
  }
  if (input.coverKey && !input.coverAlt.trim()) {
    errors.coverAlt = 'Décris la photo en quelques mots.';
  }
  if (input.bookingUrl && !isHttpUrl(input.bookingUrl)) {
    errors.bookingUrl = 'Le lien doit commencer par https://';
  }
  return errors;
}

const format = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'UTC' });
const fullDay = format({
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dayMonthYear = format({ day: 'numeric', month: 'long', year: 'numeric' });
const dayMonth = format({ day: 'numeric', month: 'long' });
const dayOnly = format({ day: 'numeric' });

const toDate = (value: string) => new Date(`${value}T00:00:00Z`);
const formatTime = (value: string) =>
  value.replace(':', ' h ').replace(/ 00$/, '');

/**
 * « samedi 14 novembre 2026 », « du 14 au 16 novembre 2026 »,
 * « du 30 octobre au 2 novembre 2026 ».
 */
export function formatWorkshopDate(
  workshop: Pick<Workshop, 'startsOn' | 'endsOn'>,
): string {
  if (!workshop.startsOn) return '';
  const start = toDate(workshop.startsOn);
  if (!workshop.endsOn || workshop.endsOn === workshop.startsOn) {
    return fullDay.format(start);
  }
  const end = toDate(workshop.endsOn);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  const from = sameMonth
    ? dayOnly.format(start)
    : sameYear
      ? dayMonth.format(start)
      : dayMonthYear.format(start);
  return `du ${from} au ${dayMonthYear.format(end)}`;
}

/** « 14 h – 17 h 30 », « dès 14 h », ou chaîne vide. */
export function formatWorkshopTime(
  workshop: Pick<Workshop, 'startTime' | 'endTime'>,
): string {
  if (workshop.startTime && workshop.endTime) {
    return `${formatTime(workshop.startTime)} – ${formatTime(workshop.endTime)}`;
  }
  if (workshop.startTime) return `dès ${formatTime(workshop.startTime)}`;
  return '';
}

/** Dernier jour (`AAAA-MM-JJ`) de l'atelier : il est passé le lendemain. */
export const lastDay = (workshop: Pick<Workshop, 'startsOn' | 'endsOn'>) =>
  workshop.endsOn || workshop.startsOn;

export const isUpcoming = (
  workshop: Pick<Workshop, 'startsOn' | 'endsOn'>,
  today = new Date().toISOString().slice(0, 10),
) => lastDay(workshop) >= today;
