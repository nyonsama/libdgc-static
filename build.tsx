import fs from "node:fs/promises";
import { renderAllPages, bundleClientJs, bundleCss } from "./src/build";
import { copyModifiedFiles } from "./src/utils/copyModifiedFiles";

const build = async () => {
  await Promise.all([
    fs.rm("dist/assets/js", { recursive: true }),
    fs.rm("dist/assets/css", { recursive: true }),
  ]);
  // await copyPublicFiles();
  await copyModifiedFiles("public", "dist");
  await Promise.all([bundleClientJs(), bundleCss()]);
  await renderAllPages();
};
const startTime = new Date();
console.log(startTime, "build start");
await build();
const finishTime = new Date();
console.log(
  finishTime,
  `finish (${finishTime.valueOf() - startTime.valueOf()}ms)`,
);
// const flag = process.argv[2];
// switch (flag) {
//   case undefined:
//     await build();
//     break;
//   case "--watch":
//   case "-w":
//     console.log("todo");
//     break;
//   default: {
//     const scriptFileName = path.basename(process.argv[1]);
//     console.log(`Usage:
// bun run ${scriptFileName} [--watch|-w]
// flags:
//     --watch|-w        watch mode`);
//   }
// }

// TODO: 只渲染有改动的东西
