import { plugin } from "bun";

// NOTE: 本来想用这个导入浏览器js代码，但是目前没有用
// 需要等 https://github.com/oven-sh/bun/issues/4689
plugin({
  name: "file suffix",
  async setup(build) {
    build.onLoad({ filter: /\?file$/ }, async (args) => {
      const filePath = args.path.replace(/\?file$/, "");
      return {
        exports: { default: filePath },
        loader: "object",
      };
    });
  },
});
