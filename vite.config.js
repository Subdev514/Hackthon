import { defineConfig } from "vite";

export default defineConfig({
  root: "src/pages",
  envDir: "../../",
  publicDir: "../../public",
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
});