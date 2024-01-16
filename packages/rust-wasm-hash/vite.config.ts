import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  base: "./",
  build: {
    sourcemap: true,
    target: "es2022",
  },
});
