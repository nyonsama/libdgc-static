import path from "path";
import fs from "node:fs/promises";

// TODO: 嵌套的页面（a/b/c.html）怎样处理

export const bundleClientJs = async () => {
  const entrypoints = ["src/client/post.ts"];
  const { outputs, success, logs } = await Bun.build({
    entrypoints,
    outdir: path.join("dist", "assets", "js"),
    root: "src/client",
    sourcemap: "external",
    splitting: true,
    target: "browser",
    minify: true,
    naming: "[dir]/[name]-[hash].[ext]",
  });
  if (!success) {
    for (const log of logs) {
      console.log(log);
    }
    throw new Error("bundle js failed");
  }
  // TODO: sourcemap有问题，需要加一下sourceMappingURL
};

export const getJsUrlPathByPage = async (pageName: string) => {
  const jsFiles = (await fs.readdir(path.join("dist", "assets", "js"))).filter(
    (fileName) => fileName.endsWith(".js"),
  );
  const result = jsFiles.find((fileName) => fileName.startsWith(pageName));
  if (!result) {
    throw new Error(`cant find js bundle file by page name '${pageName}'`);
  }
  return `/assets/js/${result}`;
};
