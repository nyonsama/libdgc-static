import fs from "node:fs/promises";
import path from "node:path";
import { renderAllPages, bundleClientJs, bundleCss } from "./src/build";

const copyPublicFiles = async () => {
  try {
    const files = await fs.readdir("public");
    for (const fileName of files) {
      const filePath = path.join("public", fileName);
      const distFilePath = path.join("dist", fileName);
      await fs.cp(filePath, distFilePath, { recursive: true });
    }
  } catch (err) {
    console.error(err);
  }
};

(async () => {
  await fs.rm("dist/assets", { recursive: true });
  await copyPublicFiles();
  await Promise.all([bundleClientJs(), bundleCss()]);
  await renderAllPages();
})();

// TODO: 只渲染有改动的东西
