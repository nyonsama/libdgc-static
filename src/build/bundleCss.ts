// import tailwind from "tailwindcss";
// import postcss from "postcss";
// import tailwindConfig from "../../tailwind.config";
// import postcssConfig from "../../postcss.config";
// import atImport from "postcss-import";
// import autoprefixer from "autoprefixer";
import fs from "node:fs/promises";

// const html = '<div class="bg-red-300"></div>';
export const bundleCss = async () => {
  // const tailwindCssConfig = await Bun.file("tailwind.config.js").text();
  // const source = await Bun.file("src/style.css").text();
  // const result = await postcss()
  //   .use(tailwind(tailwindConfig))
  //   .use(atImport())
  //   .use(autoprefixer())
  //   .process(source, {
  //     from: undefined,
  //   });
  // console.log(result.css);
  // const subprocess = Bun.spawn([
  //   "bunx",
  //   "--bun",
  //   "tailwindcss",
  //   "-i",
  //   "src/style.css",
  //   "-o",
  //   `dist/assets/css/style.css`,
  //   "--minify",
  // ]);
  // await subprocess.exited;
  // if (subprocess.exitCode !== 0) {
  //   throw new Error("run tailwindcss failed");
  // }
  // TODO: 想办法让bun知道style.css是不是新的
  // 单独watch style.css?
  const cssContent = await Bun.file("dist/assets/css/style.css").arrayBuffer();
  const hash = Bun.hash(cssContent).toString(16).padStart(16, "0");
  await fs.rename(
    "dist/assets/css/style.css",
    `dist/assets/css/style-${hash}.css`,
  );
};
