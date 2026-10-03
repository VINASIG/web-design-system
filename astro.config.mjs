import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.SITE_URL || "https://design.vinasig.io.vn",
  base: process.env.BASE_PATH ?? "/",
  trailingSlash: "always",
  output: "static",
  devToolbar: {
    enabled: false,
  },
});
