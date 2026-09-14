import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
const news = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
  schema: z.object({
    title: z.string().min(10),
    description: z.string().min(40),
    date: z.coerce.date(),
    category: z.enum(["Studio", "Góc sáng tạo"]),
    image: z.enum(["hero", "lotus"]),
    draft: z.boolean().default(false),
  }),
});
export const collections = { news };
