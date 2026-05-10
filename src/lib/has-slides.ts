import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function hasSlides(themeId: string): boolean {
  return existsSync(resolve(process.cwd(), 'slides', themeId, 'slides.md'));
}
