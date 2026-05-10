import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function hasSlides(themeId: string): boolean {
  return existsSync(resolve(projectRoot, 'slides', themeId, 'slides.md'));
}
