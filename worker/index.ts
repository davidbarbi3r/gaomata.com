/**
 * Worker du site Gao Mata. Le site est statique (fichiers de dist/, servis par
 * ASSETS) ; le Worker ne s'exécute d'abord que pour /api/* et /media/*
 * (voir `assets.run_worker_first` dans wrangler.jsonc).
 */
import { authenticate } from './auth';
import type { AdminRequest, Env } from './env';
import { fail, json } from './http';
import { publishStatus, triggerRebuild } from './publish';
import { listContent, saveContent } from './routes/content';
import { serveMedia, uploadCover } from './routes/media';
import {
  createWorkshop,
  deleteWorkshop,
  listWorkshops,
  readWorkshop,
  updateWorkshop,
} from './routes/workshops';

type Handler = (input: AdminRequest) => Promise<Response> | Response;

/** Routes de l'API admin : méthode, chemin (`:param`), traitement. */
const ADMIN_ROUTES: [string, string, Handler][] = [
  ['GET', '/me', ({ email }) => json({ email })],
  ['GET', '/content', listContent],
  ['PUT', '/content/:page', saveContent],
  ['GET', '/workshops', listWorkshops],
  ['POST', '/workshops', createWorkshop],
  ['GET', '/workshops/:id', readWorkshop],
  ['PUT', '/workshops/:id', updateWorkshop],
  ['DELETE', '/workshops/:id', deleteWorkshop],
  ['POST', '/media', uploadCover],
  ['GET', '/publish', async ({ env }) => json(await publishStatus(env))],
  [
    'POST',
    '/publish',
    async ({ env, email }) => json(await triggerRebuild(env, email)),
  ],
];

/** Route correspondant à la requête, ou la raison de l'échec. */
function matchRoute(method: string, path: string) {
  const parts = path.split('/').filter(Boolean);
  let pathExists = false;
  for (const [routeMethod, pattern, handler] of ADMIN_ROUTES) {
    const expected = pattern.split('/').filter(Boolean);
    if (expected.length !== parts.length) continue;
    const params: Record<string, string> = {};
    const matches = expected.every((segment, index) => {
      if (segment.startsWith(':')) {
        params[segment.slice(1)] = decodeURIComponent(parts[index]);
        return true;
      }
      return segment === parts[index];
    });
    if (!matches) continue;
    if (routeMethod === method) return { handler, params };
    pathExists = true;
  }
  return pathExists ? 'wrong-method' : null;
}

/**
 * API admin : identification (Cloudflare Access + liste ADMIN_EMAILS), puis
 * refus des requêtes d'écriture envoyées depuis un autre site.
 */
async function handleAdmin(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  path: string,
) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) {
      return fail(403, 'Requête refusée.');
    }
  }
  const auth = await authenticate(request, env);
  if (!auth.ok) return fail(auth.status, auth.error);

  const route = matchRoute(request.method, path);
  if (!route) return fail(404, 'Adresse inconnue.');
  if (route === 'wrong-method') return fail(405, 'Méthode non autorisée.');
  try {
    return await route.handler({
      request,
      env,
      ctx,
      params: route.params,
      email: auth.email,
    });
  } catch (error) {
    console.error('[admin]', request.method, path, error);
    return fail(500, 'Erreur du serveur. Réessaie dans un instant.');
  }
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/admin/')) {
      return handleAdmin(
        request,
        env,
        ctx,
        pathname.slice('/api/admin'.length),
      );
    }
    if (pathname.startsWith('/media/') && request.method === 'GET') {
      return serveMedia(
        decodeURIComponent(pathname.slice('/media/'.length)),
        env,
      );
    }
    if (pathname.startsWith('/api/') || pathname.startsWith('/media/')) {
      return new Response('Introuvable', { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
