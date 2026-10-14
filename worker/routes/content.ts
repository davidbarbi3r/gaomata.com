import {
  listFields,
  normalizeValue,
  sameValue,
  validateValue,
  type StoredValue,
} from '../../src/cms/fields';
import { CONTENT_SCHEMA } from '../../src/cms/schema';
import type { AdminRequest } from '../env';
import { fail, invalid, json, now, readJson } from '../http';
import { triggerRebuild } from '../publish';

/** Tous les textes modifiés (les autres gardent leur texte d'origine). */
export async function listContent({ env }: AdminRequest) {
  const { results } = await env.DB.prepare(
    'SELECT key, value FROM content',
  ).all<{ key: string; value: string }>();

  const values: Record<string, unknown> = {};
  for (const row of results) {
    try {
      values[row.key] = JSON.parse(row.value);
    } catch {
      // Valeur illisible : l'admin affichera le texte d'origine.
    }
  }
  return json({ values });
}

/**
 * Enregistre les textes d'une page. Corps : `{ values: { clé: valeur } }`
 * avec uniquement les champs modifiés. Une valeur identique au texte
 * d'origine efface la modification (le texte d'origine reprend la main).
 */
export async function saveContent({
  request,
  env,
  params,
  email,
}: AdminRequest) {
  const pageId = params.page;
  if (!(pageId in CONTENT_SCHEMA)) return fail(404, 'Page inconnue.');

  const body = await readJson<{ values?: Record<string, unknown> }>(request);
  if (!body?.values || typeof body.values !== 'object') {
    return fail(400, 'Données invalides.');
  }

  const fields = new Map(
    listFields(CONTENT_SCHEMA, pageId).map((ref) => [ref.key, ref]),
  );
  const errors: Record<string, string> = {};
  const updates: { key: string; value: StoredValue; reset: boolean }[] = [];

  for (const [key, raw] of Object.entries(body.values)) {
    const ref = fields.get(key);
    if (!ref) {
      errors[key] = 'Champ inconnu.';
      continue;
    }
    const value = normalizeValue(ref.field, raw);
    const error = validateValue(ref.field, value);
    if (error) {
      errors[key] = `« ${ref.field.label} » ${error}.`;
      continue;
    }
    updates.push({
      key,
      value,
      reset: sameValue(value, ref.field.default as StoredValue),
    });
  }

  if (Object.keys(errors).length) return invalid(errors);
  if (!updates.length) {
    return json({ triggered: false, message: 'Rien à enregistrer.' });
  }

  const timestamp = now();
  await env.DB.batch(
    updates.map((update) =>
      update.reset
        ? env.DB.prepare('DELETE FROM content WHERE key = ?1').bind(update.key)
        : env.DB.prepare(
            `INSERT INTO content (key, value, updated_at, updated_by)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value,
               updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
          ).bind(update.key, JSON.stringify(update.value), timestamp, email),
    ),
  );

  return json(await triggerRebuild(env, email));
}
