import fs from "node:fs/promises";
// HACK: 让bun能够watch css文件的变化
import cssPath from "../../temp/style.css";

export const bundleCss = async () => {
  const cssContent = await Bun.file(cssPath).arrayBuffer();
  const hash = Bun.hash(cssContent).toString(16).padStart(16, "0");
  await fs.copyFile(cssPath, `dist/assets/css/style-${hash}.css`);
};
