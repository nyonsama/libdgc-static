import path from "path";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config.js";

export const getTheme = () => {
  const theme = resolveConfig(tailwindConfig).theme;
  return {
    screens: theme.screens,
  };
};

export const bundleClientJs = async () => {
  // NOTE: 新增有js的页面时，手动把入口添加到这里
  const entryPoints = ["src/client/post.ts"];
  // HACK: 让bun watch能探测src/client的改动
  // TODO: 等 https://github.com/oven-sh/bun/issues/4689 实现了就把这个不靠谱的方法改掉
  Promise.allSettled(entryPoints.map((path) => import(`../../${path}`))).catch(
    (e) => {},
  );
  // TODO: 把tailwindcss的断点的值插入代码
  const { errors, warnings } = await esbuild.build({
    entryPoints,
    outdir: path.join("dist", "assets", "js"),
    bundle: true,
    sourcemap: "external",
    splitting: true,
    format: "esm",
    // target: "browser",
    // minify: true,
    entryNames: "[dir]/[name]-[hash]",
  });

  errors.forEach((log) => console.error(log));
  warnings.forEach((log) => console.warn(log));
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
