import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(165),
    eyebrow: z.string(),
    headline: z.string(),
    intro: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
    sections: z.record(z.string(), z.string()),
    faqs: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .default([]),
  }),
});

export const collections = { pages };
