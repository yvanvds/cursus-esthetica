import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const modules = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/modules' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    intro: z.string(),
  }),
});

const themes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/themes' }),
  schema: z.object({
    title: z.string(),
    module: z.string(),
    order: z.number(),
    shortDescription: z.string(),
    figure: z.string(),
    image: z.string().optional(),
    customLayout: z.string().optional(),
    customStyles: z.string().optional(),
    accentColor: z.string().optional(),
  }),
});

export const collections = { modules, themes };
