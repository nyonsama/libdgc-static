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
  const pagesPath = "src/client/pages";
  const entryPoints = (await fs.readdir(pagesPath))
    .filter((name) => name.endsWith(".ts"))
    .map((name) => `${pagesPath}/${name}`);
  // HACK: 让bun watch能探测src/client的改动
  // TODO: 等 https://github.com/oven-sh/bun/issues/4689 实现了就把这个不靠谱的方法改掉
  Promise.allSettled(entryPoints.map((path) => import(`../../${path}`))).catch(
    (e) => {},
  );
  // TODO: 把tailwindcss的断点的值插入代码
  const { errors, warnings, metafile } = await esbuild.build({
    entryPoints,
    outdir: path.join("dist", "assets", "js"),
    bundle: true,
    sourcemap: "external",
    // splitting: true,
    format: "esm",
    // metafile: true,
    minify: true,
    entryNames: "[dir]/[name]-[hash]",
    target: "esnext",
  });

  errors.forEach((log) => console.error(log));
  warnings.forEach((log) => console.warn(log));
  // console.log("metafile", metafile);
};

export const getJsUrlPathByPage = async (pageName: string) => {
  const jsFiles = (
    await fs.readdir(path.join("dist", "assets", "js"), { recursive: true })
  ).filter((fileName) => fileName.endsWith(".js"));
  const result =
    jsFiles.find((fileName) => fileName.startsWith(pageName)) ?? null;
  if (!result) {
    console.warn(`cant find js bundle for page '${pageName}'`);
  }
  return result ? `/assets/js/${result}` : result;
};
