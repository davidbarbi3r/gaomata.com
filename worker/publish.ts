import type { PublishResult, PublishStatus } from '../src/cms/publish';
import type { Env } from './env';
import { now } from './http';

async function setMeta(env: Env, entries: Record<string, string>) {
  await env.DB.batch(
    Object.entries(entries).map(([key, value]) =>
      env.DB.prepare(
        'INSERT INTO meta (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ).bind(key, value),
    ),
  );
}

/**
 * Relance le build du site (deploy hook Workers Builds). Le build relit D1 :
 * la modification est en ligne quelques minutes plus tard. Si un build est
 * déjà en attente, Cloudflare ne le duplique pas.
 */
export async function triggerRebuild(
  env: Env,
  email: string,
): Promise<PublishResult> {
  if (!env.DEPLOY_HOOK_URL) {
    return {
      triggered: false,
      message:
        'Enregistré. La mise en ligne automatique n’est pas configurée (DEPLOY_HOOK_URL).',
    };
  }
  try {
    const response = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
    if (!response.ok) throw new Error(String(response.status));
    await setMeta(env, { last_publish_at: now(), last_publish_by: email });
    return {
      triggered: true,
      message: 'Enregistré. Le site sera à jour d’ici deux à trois minutes.',
    };
  } catch {
    return {
      triggered: false,
      message:
        'Enregistré, mais la mise en ligne n’a pas pu être lancée. Réessaie avec « Republier le site ».',
    };
  }
}

export async function publishStatus(env: Env): Promise<PublishStatus> {
  const { results } = await env.DB.prepare(
    "SELECT key, value FROM meta WHERE key IN ('last_publish_at', 'last_publish_by')",
  ).all<{ key: string; value: string }>();
  const meta = Object.fromEntries(results.map((row) => [row.key, row.value]));
  return {
    lastPublishAt: meta.last_publish_at ?? '',
    lastPublishBy: meta.last_publish_by ?? '',
  };
}
