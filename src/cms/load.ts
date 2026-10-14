/**
 * Chargement du contenu au moment du build (Node uniquement).
 *
 * Source des données, via la variable `CMS_SOURCE` :
 * - `d1`       : base D1 de production, via l'API REST Cloudflare. Le compte
 *                et la base sont lus dans wrangler.jsonc (ou CLOUDFLARE_ACCOUNT_ID
 *                / CMS_D1_DATABASE_ID), le jeton dans le secret de build
 *                CMS_API_TOKEN ;
 * - `local`    : base D1 locale de `wrangler dev` (npm run dev:admin) ;
 * - `defaults` : textes d'origine de src/cms/schema.ts, sans aucun atelier.
 * Sans `CMS_SOURCE`, `d1` est choisi si ces trois valeurs sont connues,
 * `defaults` sinon. Sur Workers Builds, un build sans D1 échoue : on ne
 * publie jamais les textes d'origine par-dessus les modifications.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import sanitizeHtml from 'sanitize-html';
import {
  listFields,
  normalizeValue,
  validateValue,
  type Field,
  type StoredValue,
} from './fields';
import { CONTENT_SCHEMA, type Content } from './schema';
import {
  RICH_TEXT_FIELDS,
  workshopFromRow,
  type Workshop,
  type WorkshopRow,
} from './workshops';

type Row = Record<string, unknown>;
type Source = 'd1' | 'local' | 'defaults';

const PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000000';

/** Lit une valeur `"clé": "valeur"` de wrangler.jsonc (non secrète). */
function fromWranglerConfig(key: string): string {
  if (!existsSync('wrangler.jsonc')) return '';
  const match = readFileSync('wrangler.jsonc', 'utf8').match(
    new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`),
  );
  return match?.[1] ?? '';
}

function remoteConfig() {
  const databaseId =
    process.env.CMS_D1_DATABASE_ID || fromWranglerConfig('database_id');
  return {
    accountId:
      process.env.CLOUDFLARE_ACCOUNT_ID ||
      fromWranglerConfig('CLOUDFLARE_ACCOUNT_ID'),
    databaseId: databaseId === PLACEHOLDER_ID ? '' : databaseId,
    token: process.env.CMS_API_TOKEN ?? '',
  };
}

function resolveSource(): Source {
  const requested = process.env.CMS_SOURCE;
  if (requested === 'd1' || requested === 'local' || requested === 'defaults') {
    return requested;
  }
  if (requested) {
    throw new Error(
      `CMS_SOURCE inconnu : « ${requested} » (d1, local, defaults).`,
    );
  }
  const { accountId, databaseId, token } = remoteConfig();
  if (accountId && databaseId && token) return 'd1';
  if (process.env.WORKERS_CI) {
    throw new Error(
      'Build Workers Builds sans accès à D1 : vérifie database_id et CLOUDFLARE_ACCOUNT_ID dans wrangler.jsonc, et le secret de build CMS_API_TOKEN (voir docs/admin.md).',
    );
  }
  return 'defaults';
}

async function queryRemote(sql: string): Promise<Row[]> {
  const { accountId, databaseId, token } = remoteConfig();
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    },
  );
  const payload = (await response.json().catch(() => null)) as {
    success?: boolean;
    errors?: { message: string }[];
    result?: { results?: Row[] }[];
  } | null;
  if (!response.ok || !payload?.success) {
    const detail = payload?.errors?.map((error) => error.message).join(', ');
    throw new Error(
      `Lecture D1 impossible (${response.status}) : ${detail || 'réponse invalide'}`,
    );
  }
  return payload.result?.[0]?.results ?? [];
}

function queryLocal(sql: string): Row[] {
  const output = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'DB', '--local', '--json', '--command', sql],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const parsed = JSON.parse(output) as { results?: Row[] }[];
  return parsed[0]?.results ?? [];
}

async function query(source: Source, sql: string): Promise<Row[]> {
  if (source === 'defaults') return [];
  return source === 'd1' ? queryRemote(sql) : queryLocal(sql);
}

/** Espaces insécables de la typographie française (avant ?!:;», après «). */
function frenchSpacing(value: string): string {
  return value.replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ');
}

function finalize(field: Field, value: StoredValue): StoredValue {
  if (field.kind === 'list') {
    return (value as Record<string, string>[]).map((item) =>
      Object.fromEntries(
        Object.entries(item).map(([subId, subValue]) => {
          const kind = field.fields[subId]?.kind;
          const spaced =
            kind === 'url' || kind === 'email'
              ? subValue
              : frenchSpacing(subValue);
          return [subId, spaced];
        }),
      ),
    );
  }
  return field.kind === 'url' || field.kind === 'email'
    ? value
    : frenchSpacing(value as string);
}

let contentPromise: Promise<Content> | undefined;
let workshopsPromise: Promise<Workshop[]> | undefined;
let announced = false;

function source(): Source {
  const resolved = resolveSource();
  if (!announced) {
    announced = true;
    console.info(`[cms] Source du contenu : ${resolved}`);
  }
  return resolved;
}

async function loadContent(): Promise<Content> {
  const rows = await query(source(), 'SELECT key, value FROM content');
  const stored = new Map(
    rows.map((row) => [String(row.key), String(row.value)]),
  );
  const content: Record<string, Record<string, Record<string, unknown>>> = {};

  for (const ref of listFields(CONTENT_SCHEMA)) {
    let value: StoredValue = ref.field.default as StoredValue;
    const raw = stored.get(ref.key);
    if (raw !== undefined) {
      try {
        const candidate = normalizeValue(ref.field, JSON.parse(raw));
        const error = validateValue(ref.field, candidate);
        if (error) throw new Error(error);
        value = candidate;
      } catch (error) {
        console.warn(
          `[cms] Valeur ignorée pour ${ref.key} (${(error as Error).message}), texte d’origine utilisé.`,
        );
      }
    }
    content[ref.pageId] ??= {};
    content[ref.pageId][ref.sectionId] ??= {};
    content[ref.pageId][ref.sectionId][ref.fieldId] = finalize(
      ref.field,
      value,
    );
  }
  return content as unknown as Content;
}

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'hr',
  ],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    b: 'strong',
    i: 'em',
    a: (tagName, attribs) => {
      const external = /^https?:\/\//.test(attribs.href ?? '');
      return {
        tagName,
        attribs: external
          ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' }
          : attribs,
      };
    },
  },
  textFilter: (text) => frenchSpacing(text),
  exclusiveFilter: (frame) =>
    frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren.length,
};

/** Nettoie le HTML de l'éditeur : seules les mises en forme prévues passent. */
export const sanitizeRichText = (html: string) =>
  sanitizeHtml(html, RICH_TEXT_OPTIONS);

async function loadWorkshops(): Promise<Workshop[]> {
  const rows = await query(
    source(),
    "SELECT * FROM workshops WHERE status = 'published' ORDER BY starts_on, start_time, title",
  );
  return rows.map((row) => {
    const workshop = workshopFromRow(row as unknown as WorkshopRow);
    for (const field of RICH_TEXT_FIELDS) {
      workshop[field] = sanitizeRichText(workshop[field]);
    }
    workshop.title = frenchSpacing(workshop.title);
    workshop.summary = frenchSpacing(workshop.summary);
    return workshop;
  });
}

/** Tous les textes du site (modifiés dans l'admin ou d'origine). */
export function getContent(): Promise<Content> {
  contentPromise ??= loadContent();
  return contentPromise;
}

/** Ateliers publiés, triés par date (passés compris). */
export function getWorkshops(): Promise<Workshop[]> {
  workshopsPromise ??= loadWorkshops();
  return workshopsPromise;
}
