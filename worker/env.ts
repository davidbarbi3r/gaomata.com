/** Liaisons et variables du Worker (voir wrangler.jsonc et docs/admin.md). */
export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  MEDIA: R2Bucket;
  /** Emails autorisés dans l'admin, séparés par des virgules. */
  ADMIN_EMAILS?: string;
  /** Ex. https://gaomata.cloudflareaccess.com */
  ACCESS_TEAM_DOMAIN?: string;
  /** « Application Audience (AUD) Tag » de l'application Access (wrangler.jsonc). */
  ACCESS_AUD?: string;
  /** Développement local uniquement : email simulé, ignoré hors localhost. */
  DEV_ADMIN_EMAIL?: string;
  /** Secret : deploy hook Workers Builds, appelé après chaque modification. */
  DEPLOY_HOOK_URL?: string;
}

/** Ce que reçoit chaque route de l'API admin. */
export interface AdminRequest {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
  params: Record<string, string>;
  email: string;
}
