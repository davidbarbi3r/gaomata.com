import { SITE } from '../data/site';
import { mediaPath } from './workshops';

/**
 * URL absolue d'une photo stockée dans R2, lue au moment du build.
 * En local (`npm run dev:admin`), CMS_MEDIA_ORIGIN pointe vers wrangler dev.
 */
export const mediaOrigin = () => process.env.CMS_MEDIA_ORIGIN || SITE.url;

export const mediaUrl = (key: string) =>
  new URL(mediaPath(key), mediaOrigin()).href;
