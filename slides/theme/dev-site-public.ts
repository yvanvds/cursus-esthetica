import { createReadStream, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..', '..');
const publicDir = resolve(projectRoot, 'public');

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
};

/**
 * Dev-server plugin: serveert `/<siteBase>/...`-paden uit `public/` van de
 * site, zodat decks naar bestaande site-assets kunnen wijzen zonder kopie
 * onder `slides/<id>/public/`.
 *
 * Voor productie zie `fixDoubledSiteBase` in `build-postprocess.mjs`:
 * Slidev/Vite prefixen `BASE_URL` aan elk `/`-pad in templates wat in
 * production een dubbele prefix oplevert; die wordt na de slidev-build
 * weggepatched.
 */
export function siteAssetsPlugin(siteBase = '/cursus-esthetica') {
  const devPrefix = siteBase.replace(/\/$/, '') + '/';

  return {
    name: 'cursus-esthetica:serve-site-public',

    configureServer(server: {
      middlewares: {
        use: (
          fn: (
            req: { url?: string },
            res: { setHeader: (k: string, v: string) => void } & NodeJS.WritableStream,
            next: () => void,
          ) => void,
        ) => void;
      };
    }) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(devPrefix)) return next();
        const rel = req.url.slice(devPrefix.length).split('?')[0];
        const file = resolve(publicDir, rel);
        if (!file.startsWith(publicDir)) return next();
        try {
          if (!statSync(file).isFile()) return next();
        } catch {
          return next();
        }
        const ext = file.slice(file.lastIndexOf('.') + 1).toLowerCase();
        const mime = MIME[ext];
        if (mime) res.setHeader('Content-Type', mime);
        createReadStream(file).pipe(res);
      });
    },
  };
}
