import fs from "node:fs/promises";
// HACK: 让bun能够watch css文件的变化
import cssPath from "../../temp/style.css";
// HACK: 直接导入tailwindcss cli的js代码
import { build } from "tailwindcss/lib/cli/build";
// import { Worker } from "node:worker_threads";

export const buildTailwindCss = async () => {
  await build({
    "--input": "src/style.css",
    "--output": "temp/style.css",
    "--minify": true,
  });
  const cssContent = await Bun.file("temp/style.css").arrayBuffer();
  const hash = Bun.hash(cssContent).toString(16).padStart(16, "0");
  // TODO: 偶尔会报找不到文件的错误
  await fs.copyFile(cssPath, `dist/assets/css/style-${hash}.css`);
};

// export const spawnTainwind = async () => {
//   const proc = Bun.spawn([
//     "bunx",
//     "--bun",
//     "tailwindcss",
//     "-i",
//     "src/style.css",
//     "-o",
//     "temp/style.css",
//     "--minify",
//   ]);
//   await proc.exited;
//   const cssContent = await Bun.file("temp/style.css").arrayBuffer();
//   const hash = Bun.hash(cssContent).toString(16).padStart(16, "0");
//   await fs.copyFile(cssPath, `dist/assets/css/style-${hash}.css`);
// };

// export const runTailwindWorker = async () => {
//   const worker = new Worker("node_modules/tailwindcss/lib/cli.js", {
//     argv: ["-i", "src/style.css", "-o", "temp/style.css", "--minify"],
//   });
//   return new Promise<void>((resolve, reject) => {
//     worker.on("exit", () => {
//       resolve();
//     });
//     worker.on("error", () => {
//       reject();
//     });
//   });
// };

// export const bundleCss = async () => {
//   const cssContent = await Bun.file(cssPath).arrayBuffer();
//   const hash = Bun.hash(cssContent).toString(16).padStart(16, "0");
//   await fs.copyFile(cssPath, `dist/assets/css/style-${hash}.css`);
// };
