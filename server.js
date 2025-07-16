import express from "express";
import sirv from "sirv";

// Constants
const port = process.env.PORT || 5173;
const base = process.env.BASE || "/";

// Create http server
const app = express();

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
const { createServer } = await import("vite");
vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  base,
  mode: "production",
});
app.use(vite.middlewares);

// Serve HTML
app.use("*all", async (req, res, next) => {
  try {
    const url = req.originalUrl.replace(/(index\.html)|(\.html)|\/$/, "");

    /** @type {import('./src/entry-server.ts')} */
    const server = await vite.ssrLoadModule("/src/entry-server.ts");
    const { render, getRoute } = server;
    if (!getRoute(url)) {
      next();
      return;
    }

    const rendered = await render(url);
    const html = await vite.transformIndexHtml(url, rendered.html);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log("error", e.stack);
    res.status(500).end(e.stack);
    throw e;
  }
});

const postAssets = sirv("posts", { dev: true });
app.all(/^\/posts\/[^\/]+\/.+/, (req, res, next) => {
  req.url = req.url.replace(/^\/posts\//, "");
  postAssets(req, res, next);
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
