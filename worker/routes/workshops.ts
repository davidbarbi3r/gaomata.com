import {
  cleanWorkshopInput,
  workshopColumnValues,
  workshopFromRow,
  type WorkshopInput,
  type WorkshopRow,
} from '../../src/cms/workshops';
import type { AdminRequest, Env } from '../env';
import { fail, invalid, json, now, readJson } from '../http';
import { triggerRebuild } from '../publish';
import {
  checkWorkshop,
  getWorkshop,
  isSlugConflict,
  removeOrphanCovers,
  SLUG_TAKEN,
} from '../workshops';

const DRAFT_ONLY = {
  triggered: false,
  message: 'Brouillon enregistré. Il n’apparaît pas sur le site.',
};

/** Un brouillon qui reste brouillon ne change rien au site public. */
const publishIfVisible = (env: Env, email: string, visible: boolean) =>
  visible ? triggerRebuild(env, email) : Promise.resolve(DRAFT_ONLY);

export async function listWorkshops({ env }: AdminRequest) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM workshops ORDER BY starts_on DESC, start_time DESC, title',
  ).all<WorkshopRow>();
  return json({ workshops: results.map(workshopFromRow) });
}

export async function readWorkshop({ env, params }: AdminRequest) {
  const workshop = await getWorkshop(env, params.id);
  return workshop ? json({ workshop }) : fail(404, 'Atelier introuvable.');
}

/** Écrit l'atelier ; renvoie une réponse d'erreur si le slug est déjà pris. */
async function write(statement: D1PreparedStatement): Promise<Response | null> {
  try {
    await statement.run();
    return null;
  } catch (error) {
    if (isSlugConflict(error)) return invalid({ slug: SLUG_TAKEN });
    throw error;
  }
}

export async function createWorkshop({
  request,
  env,
  ctx,
  email,
}: AdminRequest) {
  const input = cleanWorkshopInput(await readJson(request));
  if (!input) return fail(400, 'Données invalides.');
  const errors = await checkWorkshop(env, input);
  if (Object.keys(errors).length) return invalid(errors);

  const id = crypto.randomUUID();
  const timestamp = now();
  const columns = workshopColumnValues(input);
  const names = [
    'id',
    ...columns.map((entry) => entry.column),
    'created_at',
    'updated_at',
    'updated_by',
  ];
  const conflict = await write(
    env.DB.prepare(
      `INSERT INTO workshops (${names.join(', ')})
       VALUES (${names.map((_, index) => `?${index + 1}`).join(', ')})`,
    ).bind(
      id,
      ...columns.map((entry) => entry.value),
      timestamp,
      timestamp,
      email,
    ),
  );
  if (conflict) return conflict;

  ctx.waitUntil(removeOrphanCovers(env));
  const publish = await publishIfVisible(env, email, isPublished(input));
  return json({ id, ...publish }, { status: 201 });
}

export async function updateWorkshop({
  request,
  env,
  ctx,
  params,
  email,
}: AdminRequest) {
  const previous = await getWorkshop(env, params.id);
  if (!previous) return fail(404, 'Atelier introuvable.');

  const input = cleanWorkshopInput(await readJson(request));
  if (!input) return fail(400, 'Données invalides.');
  const errors = await checkWorkshop(env, input, previous.id);
  if (Object.keys(errors).length) return invalid(errors);

  const columns = workshopColumnValues(input);
  const count = columns.length;
  const conflict = await write(
    env.DB.prepare(
      `UPDATE workshops
       SET ${columns.map((entry, index) => `${entry.column} = ?${index + 1}`).join(', ')},
         updated_at = ?${count + 1}, updated_by = ?${count + 2}
       WHERE id = ?${count + 3}`,
    ).bind(...columns.map((entry) => entry.value), now(), email, previous.id),
  );
  if (conflict) return conflict;

  ctx.waitUntil(removeOrphanCovers(env));
  const visible = isPublished(input) || isPublished(previous);
  const publish = await publishIfVisible(env, email, visible);
  return json({ id: previous.id, ...publish });
}

export async function deleteWorkshop({
  env,
  ctx,
  params,
  email,
}: AdminRequest) {
  const previous = await getWorkshop(env, params.id);
  if (!previous) return fail(404, 'Atelier introuvable.');

  await env.DB.prepare('DELETE FROM workshops WHERE id = ?1')
    .bind(previous.id)
    .run();
  ctx.waitUntil(removeOrphanCovers(env));

  const publish = isPublished(previous)
    ? await triggerRebuild(env, email)
    : { triggered: false, message: 'Brouillon supprimé.' };
  return json({ deleted: true, ...publish });
}

const isPublished = (workshop: Pick<WorkshopInput, 'status'>) =>
  workshop.status === 'published';
