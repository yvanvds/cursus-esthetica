import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

// .strict() overal: zonder dat strippen zod-objecten onbekende sleutels stil.
// Zo bleef het dode `id:`-veld jarenlang staan (#7), en zo zou een typo als
// `captoin:` een bijschrift geruisloos laten verdwijnen. Nu is het een fout.
const figureImage = z.object({
  src: z.string(),
  caption: z.string().optional(),
  source: z.string().optional(),
  alt: z.string().optional(),
}).strict();

const modules = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/modules' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    intro: z.string().optional(),
  }).strict(),
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
    customHeader: z.boolean().optional(),
    accentColor: z.string().optional(),
    figures: z.record(z.string(), z.object({ images: z.array(figureImage) }).strict()).optional(),
    videos: z.record(z.string(), z.object({
      youtube: z.string().length(11),
      title: z.string(),
      source: z.string(),
      start: z.number().optional(),
      end: z.number().optional(),
      aspectRatio: z.string().optional(),
    }).strict()).optional(),
  }).strict(),
});

export const collections = { modules, themes };
