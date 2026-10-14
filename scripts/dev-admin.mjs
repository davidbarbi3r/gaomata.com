/**
 * Admin en local, au plus près de la production :
 * - base D1 et photos R2 locales (dossier .wrangler/) ;
 * - `wrangler dev` sert le Worker (site construit + API admin) sur :8788 ;
 * - chaque enregistrement dans l'admin appelle un « deploy hook » local qui
 *   reconstruit le site (comme Workers Builds en production).
 *
 * Usage : npm run dev:admin, puis http://localhost:8788/admin
 */
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';

const SITE_PORT = 8788;
const HOOK_PORT = 8790;
const env = {
  ...process.env,
  CMS_SOURCE: 'local',
  CMS_MEDIA_ORIGIN: `http://localhost:${SITE_PORT}`,
};

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env, ...options });
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(' ')} → ${code}`)),
    );
  });

if (!existsSync('.dev.vars')) {
  copyFileSync('.dev.vars.example', '.dev.vars');
  console.info('[dev:admin] .dev.vars créé depuis .dev.vars.example');
}
mkdirSync('dist', { recursive: true });

await run('npx', ['wrangler', 'd1', 'migrations', 'apply', 'DB', '--local']);

let building = false;
let queued = false;
async function build() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  console.info('\n[dev:admin] Reconstruction du site…');
  try {
    await run('npx', ['astro', 'build'], {
      env: { ...env, ASTRO_OUT_DIR: '.wrangler/dist-next' },
    });
    await run('rsync', ['-a', '--delete', '.wrangler/dist-next/', 'dist/']);
    console.info(`[dev:admin] Site à jour → http://localhost:${SITE_PORT}`);
  } catch (error) {
    console.error('[dev:admin] Échec du build :', error.message);
  } finally {
    building = false;
    if (queued) {
      queued = false;
      build();
    }
  }
}

createServer((request, response) => {
  if (request.method === 'POST') build();
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end('{"ok":true}');
}).listen(HOOK_PORT);

// `--var` fait ignorer .dev.vars par wrangler : on transmet tout explicitement.
const devVars = readFileSync('.dev.vars', 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .map((line) => line.replace('=', ':'));
const worker = spawn(
  'npx',
  [
    'wrangler',
    'dev',
    '--port',
    String(SITE_PORT),
    // Sans ça, wrangler présente les requêtes comme venant de gaomata.fr
    // (routes de wrangler.jsonc) et la connexion locale est refusée.
    '--local-upstream',
    `localhost:${SITE_PORT}`,
    '--var',
    ...devVars,
    `DEPLOY_HOOK_URL:http://localhost:${HOOK_PORT}/rebuild`,
  ],
  { stdio: 'inherit', env },
);
worker.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => worker.kill('SIGINT'));

// Laisse wrangler démarrer (les photos des ateliers sont lues sur :8788).
for (let attempt = 0; attempt < 60; attempt += 1) {
  try {
    await fetch(`http://localhost:${SITE_PORT}/`);
    break;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
await build();
