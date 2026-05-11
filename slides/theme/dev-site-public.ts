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

export function siteAssetsPlugin(siteBase = '/cursus-esthetica') {
  const prefix = siteBase.replace(/\/$/, '') + '/';
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
        if (!req.url || !req.url.startsWith(prefix)) return next();
        const rel = req.url.slice(prefix.length).split('?')[0];
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
