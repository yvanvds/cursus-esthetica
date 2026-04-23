// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://yvanvds.github.io',
  base: '/cursus-esthetica',
  integrations: [mdx()],
});
