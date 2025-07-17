// Pre-render the app into static HTML.
// run `npm run generate` and then `dist/static` can be served as a static site.

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { build } from "vite";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const toAbsolute = (p) => path.resolve(__dirname, p);

process.cwd(__dirname);
/** @type {import('./src/entry-server')} */
const { render, getRoute, getStaticRoutes } = await import(
  "./dist/server/entry-server.js"
);

(async () => {
  try {
    await fs.rm(".temp", { recursive: true });
  } catch (e) {
    if (e.code !== "ENOENT") {
      throw e;
    }
  }
  await fs.mkdir(toAbsolute(".temp"), { recursive: true });
  const staticRoutes = await getStaticRoutes();
  const buildInput = {};
  const htmlFiles = [];
  for (const url of staticRoutes) {
    const trimmed = url.replace(/(\/?index\.html)|(\.html)|\/$/, "");
    console.log(trimmed);
    const { html } = await render(trimmed);
    const filePath = path.join(".temp", url);
    buildInput[trimmed.replace(/^\//, "")] = filePath;
    htmlFiles.push(filePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, html);
  }
  await build({
    build: {
      rollupOptions: {
        input: htmlFiles,
        output: {
          dir: "dist",
        },
      },
    },
  });
  await fs.rm(".temp", { recursive: true });
  const outputs = await fs.readdir(path.join("dist", ".temp"));
  for (const output of outputs) {
    await fs.rename(
      path.join("dist", ".temp", output),
      path.join("dist", output),
    );
  }
  await fs.rmdir(path.join("dist", ".temp"));

  const posts = await fs.readdir("posts");
  for (const post of posts) {
    const assets = await fs.readdir(path.join("posts", post));
    for (const asset of assets) {
      if (asset === "index.md" || asset === "build.sh") {
        continue;
      }
      await fs.cp(
        path.join("posts", post, asset),
        path.join("dist", "posts", post, asset),
        { recursive: true },
      );
    }
  }
})();
