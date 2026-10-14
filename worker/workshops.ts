import {
  validateWorkshop,
  workshopFromRow,
  type WorkshopErrors,
  type WorkshopInput,
  type WorkshopRow,
} from '../src/cms/workshops';
import type { Env } from './env';

export async function getWorkshop(env: Env, id: string) {
  const row = await env.DB.prepare('SELECT * FROM workshops WHERE id = ?1')
    .bind(id)
    .first<WorkshopRow>();
  return row ? workshopFromRow(row) : null;
}

export async function checkWorkshop(
  env: Env,
  input: WorkshopInput,
  currentId = '',
): Promise<WorkshopErrors> {
  const errors = validateWorkshop(input);
  if (!errors.slug && (await slugTaken(env, input.slug, currentId))) {
    errors.slug = SLUG_TAKEN;
  }
  return errors;
}

export const SLUG_TAKEN =
  'Cette adresse est déjà utilisée par un autre atelier.';

async function slugTaken(env: Env, slug: string, currentId: string) {
  const clash = await env.DB.prepare(
    'SELECT 1 FROM workshops WHERE slug = ?1 AND id != ?2',
  )
    .bind(slug, currentId)
    .first();
  return Boolean(clash);
}

/** Deux enregistrements simultanés peuvent passer la vérification du slug. */
export const isSlugConflict = (error: unknown) =>
  String(error).includes('UNIQUE constraint failed: workshops.slug');

const ORPHAN_DELAY_MS = 24 * 60 * 60 * 1000;

/**
 * Supprime de R2 les photos qu'aucun atelier n'utilise : photos remplacées,
 * retirées, ou envoyées pour un atelier jamais enregistré. Le délai de 24 h
 * protège une photo envoyée dans un formulaire pas encore enregistré.
 */
export async function removeOrphanCovers(env: Env) {
  const { results } = await env.DB.prepare(
    "SELECT cover_key FROM workshops WHERE cover_key != ''",
  ).all<{ cover_key: string }>();
  const used = new Set(results.map((row) => row.cover_key));
  const threshold = Date.now() - ORPHAN_DELAY_MS;

  let cursor: string | undefined;
  do {
    const page = await env.MEDIA.list({ prefix: 'ateliers/', cursor });
    const orphans = page.objects
      .filter(
        (object) =>
          !used.has(object.key) && object.uploaded.getTime() < threshold,
      )
      .map((object) => object.key);
    if (orphans.length) await env.MEDIA.delete(orphans);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}
