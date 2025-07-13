import express from "express";

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
});
app.use(vite.middlewares);

// Serve HTML
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    /** @type {import('./src/entry-server.ts')} */
    const server = await vite.ssrLoadModule("/src/entry-server.ts");
    const { render, getPage } = server;
    if (!getPage(url)) {
      res.status(404);
      return;
    }

    const rendered = await render(url);
    const html = await vite.transformIndexHtml(url, `<!DOCTYPE html>${rendered.html}`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
