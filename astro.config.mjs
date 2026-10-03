import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.SITE_URL || "https://vinasig.github.io",
  base: process.env.BASE_PATH ?? "/web-design-system",
  trailingSlash: "always",
  output: "static",
  devToolbar: {
    enabled: false,
  },
});
