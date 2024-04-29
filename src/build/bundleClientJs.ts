import path from "path";
import fs from "node:fs/promises";
// import type { BunPlugin } from "bun";
// import postPath from "../client/post.ts?file";
import * as esbuild from "esbuild";

import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config.js";
import { Config } from "tailwindcss/types/config.js";

export const getTheme = () => {
  const theme = resolveConfig(tailwindConfig).theme;
  return {
    screens: theme.screens,
  };
};

// 从jsx文件里导入不含jsx的东西，会导致间接导入react/jsx-runtime
// 目前使用bun的话，没有简单的办法
// 改用esbuild
// const maskReactJSX: BunPlugin = {
//   name: "mask-react-jsx-runtime",
//   setup(build) {
//     build.module("react/jsx-runtime", () => {
//       return {
//         exports: {},
//         loader: "object",
//       };
//     });
//   },
// };

export const bundleClientJs = async () => {
  // NOTE: 新增有js的页面时，手动把入口添加到这里
  // const entrypoints = [postPath];
  const entryPoints = ["src/client/post.ts"];
  // HACK: 让bun watch能探测src/client的改动
  // TODO: 等 https://github.com/oven-sh/bun/issues/4689 实现了就把这个不靠谱的方法改掉
  Promise.allSettled(entryPoints.map((path) => import(`../../${path}`))).catch(
    (e) => {},
  );
  // TODO
  const { errors, warnings } = await esbuild.build({
    entryPoints,
    outdir: path.join("dist", "assets", "js"),
    bundle: true,
    // root: "src/client",
    sourcemap: "external",
    splitting: true,
    format: "esm",
    // target: "browser",
    // minify: true,
    // naming: "[dir]/[name]-[hash].[ext]",
    entryNames: "[dir]/[name]-[hash]",
  });
  // const { outputs, success, logs } = await Bun.build({
  //   entrypoints,
  //   outdir: path.join("dist", "assets", "js"),
  //   root: "src/client",
  //   // sourcemap: "external",
  //   splitting: true,
  //   target: "browser",
  //   // minify: true,
  //   naming: "[dir]/[name]-[hash].[ext]",
  // });

  errors.forEach((log) => console.error(log));
  warnings.forEach((log) => console.warn(log));
  // if (!success) {
  //   for (const log of logs) {
  //     console.log(log);
  //   }
  //   throw new Error("bundle js failed");
  // }
  // HACK: 生成的js文件没有sourceMappingURL，需要加一下
  // const tasks = outputs.map(async (trunk) => {
  //   if (!trunk.sourcemap) {
  //     return;
  //   }
  //   const sourcemapFilename = path.basename(trunk.sourcemap.path);
  //   const file = await fs.open(trunk.path, "a");
  //   await file.write(`\n//# sourceMappingURL=${sourcemapFilename}`);
  // });
  // await Promise.all(tasks);
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
