import postcssNesting from "postcss-nesting";
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [postcssNesting],
};
export default config;
