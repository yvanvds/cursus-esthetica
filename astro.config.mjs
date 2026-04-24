// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { remarkReadingTime } from './src/lib/reading-time.mjs';
import { remarkFigureLinks } from './src/lib/remark-figure-links.ts';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://yvanvds.github.io',
  base: '/cursus-esthetica',
  integrations: [mdx({
    remarkPlugins: [remarkReadingTime, remarkFigureLinks],
  }), react()],
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
});