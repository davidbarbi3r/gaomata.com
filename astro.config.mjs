import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

const site = 'https://www.gaomata.fr';
// Photos des ateliers (R2), optimisées au build. En local, wrangler.
const mediaOrigin = new URL(process.env.CMS_MEDIA_ORIGIN || site);

export default defineConfig({
  site,
  output: 'static',
  // `npm run dev:admin` construit à côté puis remplace dist d'un coup.
  outDir: process.env.ASTRO_OUT_DIR || './dist',
  trailingSlash: 'never',
  integrations: [
    preact(),
    sitemap({
      filter: (page) =>
        !page.includes('/mentions-legales') && !page.includes('/admin'),
    }),
  ],
  image: {
    responsiveStyles: true,
    remotePatterns: [
      {
        protocol: mediaOrigin.protocol.replace(':', ''),
        hostname: mediaOrigin.hostname,
        ...(mediaOrigin.port ? { port: mediaOrigin.port } : {}),
        pathname: '/media/**',
      },
    ],
  },
});
