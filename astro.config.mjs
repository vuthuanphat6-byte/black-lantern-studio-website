import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  site: "https://blacklantern.games",
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap({ filter: (url) => !url.endsWith("/404/") })],
  build: { format: "directory" },
  vite: { build: { cssMinify: true } },
});
