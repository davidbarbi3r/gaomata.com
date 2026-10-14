import type { AdminRequest, Env } from '../env';
import { fail, json } from '../http';

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Envoi d'une photo de couverture (multipart, champ `file`). L'admin la
 * redimensionne et la convertit en JPEG dans le navigateur avant l'envoi.
 */
export async function uploadCover({ request, env, email }: AdminRequest) {
  let file: File | null;
  try {
    const entry = (await request.formData()).get('file');
    file = entry instanceof File ? entry : null;
  } catch {
    return fail(400, 'Envoi invalide.');
  }
  if (!file) return fail(400, 'Aucune photo reçue.');
  if (file.type !== 'image/jpeg') {
    return fail(415, 'Format non pris en charge : la photo doit être en JPEG.');
  }
  if (file.size > MAX_BYTES) {
    return fail(413, 'Photo trop lourde (8 Mo maximum).');
  }

  const key = `ateliers/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.jpg`;
  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: 'image/jpeg' },
    customMetadata: { uploadedBy: email },
  });
  return json({ key }, { status: 201 });
}

/** Photos des ateliers stockées dans R2, servies publiquement sur /media/*. */
export async function serveMedia(key: string, env: Env) {
  if (!key || key.includes('..')) {
    return new Response('Introuvable', { status: 404 });
  }
  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Introuvable', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  // Chaque photo a une clé unique : elle ne change jamais.
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(object.body, { headers });
}
