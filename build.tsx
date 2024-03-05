import fs from "node:fs/promises";
import { renderAllPages, bundleClientJs, buildTailwindCss } from "./src/build";
import { copyModifiedFiles } from "./src/utils/copyModifiedFiles";

const build = async () => {
  await Promise.all([
    fs.rm("dist/assets/js", { recursive: true }),
    fs.rm("dist/assets/css", { recursive: true }),
  ]);
  await Promise.all([
    copyModifiedFiles("public", "dist"),
    bundleClientJs(),
    buildTailwindCss(),
  ]);
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

// TODO: 只渲染有改动的东西
