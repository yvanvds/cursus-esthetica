import type { CSSProperties } from 'vue';

const SITE_BASE = '/cursus-esthetica';

/**
 * Resolved asset URL for layout `image` props. Verschilt van Slidev's
 * standaard-resolver doordat paden die al absoluut zijn t.o.v. de site
 * (`/cursus-esthetica/...`) ongewijzigd doorgegeven worden i.p.v. nog
 * eens de deck-base ervoor te krijgen.
 */
export function resolveAsset(path: string): string {
  if (!path) return path;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  if (path.startsWith(SITE_BASE + '/') || path === SITE_BASE) return path;
  if (path.startsWith('/')) {
    const base = import.meta.env.BASE_URL || '/';
    return base.replace(/\/$/, '') + path;
  }
  return path;
}

/**
 * Mirror van Slidev's eigen `handleBackground`, maar via `resolveAsset` zodat
 * `/cursus-esthetica/...`-paden niet dubbel-geprefixed worden.
 */
export function handleBackground(
  background?: string,
  dim = false,
  backgroundSize = 'cover',
): CSSProperties {
  const isColor = !!background && (background.startsWith('#') || background.startsWith('rgb'));
  let backgroundImage: string | undefined;
  if (background && !isColor) {
    const url = `url("${resolveAsset(background)}")`;
    backgroundImage = dim ? `linear-gradient(#0005, #0008), ${url}` : url;
  }
  const style: CSSProperties = {
    background: isColor ? background : undefined,
    color: background && !isColor ? 'white' : undefined,
    backgroundImage,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize,
  };
  if (!style.background) delete style.background;
  return style;
}
