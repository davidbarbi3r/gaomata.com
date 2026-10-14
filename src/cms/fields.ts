/**
 * Vocabulaire du modèle de contenu éditable.
 *
 * Ce fichier ne dépend ni d'Astro ni de Node : il est importé à la fois par le
 * build (rendu statique), par l'interface d'administration (navigateur) et par
 * le Worker Cloudflare (API).
 */

export type ScalarKind = 'text' | 'textarea' | 'url' | 'email';

export interface ScalarField {
  kind: ScalarKind;
  label: string;
  /** Aide affichée sous le champ dans l'admin. */
  help?: string;
  default: string;
  /** Un champ optionnel peut être laissé vide. */
  optional?: boolean;
  /** Longueur maximale conseillée (compteur dans l'admin, bloquant à l'enregistrement). */
  max?: number;
}

export type ListItem<I extends Record<string, ScalarField>> = {
  [K in keyof I]: string;
};

export interface ListField<
  I extends Record<string, ScalarField> = Record<string, ScalarField>,
> {
  kind: 'list';
  label: string;
  help?: string;
  /** Nom d'un élément, au singulier (« un tarif », « un avis »…). */
  itemLabel: string;
  /** Sous-champ utilisé comme titre de chaque élément replié dans l'admin. */
  itemTitle: keyof I & string;
  fields: I;
  default: ListItem<I>[];
  min?: number;
  max?: number;
}

export type Field = ScalarField | ListField;

export interface SectionDef<
  F extends Record<string, Field> = Record<string, Field>,
> {
  label: string;
  help?: string;
  fields: F;
}

export interface PageDef<
  S extends Record<string, SectionDef> = Record<string, SectionDef>,
> {
  label: string;
  /** Chemin public de la page, `null` pour les éléments communs à tout le site. */
  path: string | null;
  help?: string;
  sections: S;
}

export type FieldValue<F> =
  F extends ListField<infer I> ? ListItem<I>[] : string;

export type SectionValues<S extends SectionDef> = {
  [K in keyof S['fields']]: FieldValue<S['fields'][K]>;
};

export type PageValues<P extends PageDef> = {
  [K in keyof P['sections']]: SectionValues<P['sections'][K]>;
};

type ScalarOptions = Omit<ScalarField, 'kind' | 'label' | 'default'>;

export const text = (
  label: string,
  value: string,
  options: ScalarOptions = {},
): ScalarField => ({ kind: 'text', label, default: value, ...options });

export const textarea = (
  label: string,
  value: string,
  options: ScalarOptions = {},
): ScalarField => ({ kind: 'textarea', label, default: value, ...options });

export const url = (
  label: string,
  value: string,
  options: ScalarOptions = {},
): ScalarField => ({ kind: 'url', label, default: value, ...options });

export const email = (
  label: string,
  value: string,
  options: ScalarOptions = {},
): ScalarField => ({ kind: 'email', label, default: value, ...options });

export function list<const I extends Record<string, ScalarField>>(
  label: string,
  config: {
    itemLabel: string;
    itemTitle: keyof I & string;
    fields: I;
    help?: string;
    min?: number;
    max?: number;
  },
  value: ListItem<I>[],
): ListField<I> {
  return { kind: 'list', label, default: value, ...config };
}

export function section<const F extends Record<string, Field>>(
  label: string,
  fields: F,
  help?: string,
): SectionDef<F> {
  return { label, help, fields };
}

export function page<const S extends Record<string, SectionDef>>(
  label: string,
  path: string | null,
  sections: S,
  help?: string,
): PageDef<S> {
  return { label, path, help, sections };
}

/** Clé de stockage d'un champ : `page.section.champ`. */
export const fieldKey = (pageId: string, sectionId: string, fieldId: string) =>
  `${pageId}.${sectionId}.${fieldId}`;

export interface FieldRef {
  key: string;
  pageId: string;
  sectionId: string;
  fieldId: string;
  field: Field;
}

export function listFields(
  pages: Record<string, PageDef>,
  onlyPage?: string,
): FieldRef[] {
  const refs: FieldRef[] = [];
  for (const [pageId, pageDef] of Object.entries(pages)) {
    if (onlyPage && pageId !== onlyPage) continue;
    for (const [sectionId, sectionDef] of Object.entries(pageDef.sections)) {
      for (const [fieldId, field] of Object.entries(sectionDef.fields)) {
        refs.push({
          key: fieldKey(pageId, sectionId, fieldId),
          pageId,
          sectionId,
          fieldId,
          field,
        });
      }
    }
  }
  return refs;
}

export type StoredValue = string | Record<string, string>[];

const isUrl = (value: string) => {
  if (value.startsWith('/') || value.startsWith('#')) return true;
  try {
    const parsed = new URL(value);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function checkScalar(field: ScalarField, value: unknown): string | null {
  if (typeof value !== 'string') return 'doit être un texte';
  const trimmed = value.trim();
  if (!trimmed && !field.optional) return 'ne peut pas être vide';
  if (field.max && value.length > field.max) {
    return `dépasse ${field.max} caractères`;
  }
  if (trimmed && field.kind === 'url' && !isUrl(trimmed)) {
    return 'doit être un lien valide (https://…)';
  }
  if (trimmed && field.kind === 'email' && !isEmail(trimmed)) {
    return 'doit être une adresse email valide';
  }
  return null;
}

/**
 * Vérifie qu'une valeur respecte la définition du champ.
 * Retourne un message d'erreur en français, ou `null` si tout va bien.
 */
export function validateValue(field: Field, value: unknown): string | null {
  if (field.kind !== 'list') return checkScalar(field, value);
  if (!Array.isArray(value)) return 'doit être une liste';
  if (field.min !== undefined && value.length < field.min) {
    return `doit contenir au moins ${field.min} élément(s)`;
  }
  if (field.max !== undefined && value.length > field.max) {
    return `ne peut pas contenir plus de ${field.max} éléments`;
  }
  for (const [index, item] of value.entries()) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return `élément ${index + 1} invalide`;
    }
    for (const [subId, subField] of Object.entries(field.fields)) {
      const error = checkScalar(
        subField,
        (item as Record<string, unknown>)[subId] ?? '',
      );
      if (error) return `élément ${index + 1}, « ${subField.label} » ${error}`;
    }
  }
  return null;
}

/** Ne garde que les sous-champs connus d'une liste, pour un stockage propre. */
export function normalizeValue(field: Field, value: unknown): StoredValue {
  if (field.kind !== 'list') return typeof value === 'string' ? value : '';
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const clean: Record<string, string> = {};
    for (const subId of Object.keys(field.fields)) {
      const raw = (item as Record<string, unknown>)?.[subId];
      clean[subId] = typeof raw === 'string' ? raw : '';
    }
    return clean;
  });
}

export const sameValue = (a: StoredValue, b: StoredValue) =>
  JSON.stringify(a) === JSON.stringify(b);
