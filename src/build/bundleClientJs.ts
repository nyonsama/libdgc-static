import path from "path";
import fs from "node:fs/promises";

// TODO: 嵌套的页面（a/b/c.html）怎样处理

export const bundleClientJs = async () => {
  // NOTE: 新增有js的页面时，手动把入口添加到这里
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
    loader: {
      ".css": "file",
    },
  });
  if (!success) {
    for (const log of logs) {
      console.log(log);
    }
    throw new Error("bundle js failed");
  }
  // HACK: 生成的js文件没有sourceMappingURL，需要加一下
  const tasks = outputs.map(async (trunk) => {
    if (!trunk.sourcemap) {
      return;
    }
    const sourcemapFilename = path.basename(trunk.sourcemap.path);
    const file = await fs.open(trunk.path, "a");
    await file.write(`\n//# sourceMappingURL=${sourcemapFilename}`);
  });
  await Promise.all(tasks);
};

export const getJsUrlPathByPage = async (pageName: string) => {
  const jsFiles = (
    await fs.readdir(path.join("dist", "assets", "js"), { recursive: true })
  ).filter((fileName) => fileName.endsWith(".js"));
  const result = jsFiles.find((fileName) => fileName.startsWith(pageName));
  if (!result) {
    throw new Error(`cant find js bundle file by page name '${pageName}'`);
  }
  return `/assets/js/${result}`;
};
