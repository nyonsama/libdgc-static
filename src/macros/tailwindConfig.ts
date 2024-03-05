import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config.js";
import { Config } from "tailwindcss/types/config.js";

export const getFullConfig = () => {
  return resolveConfig(tailwindConfig);
};

// NOTE: 直接返回theme会报converting circular structure to Bun
// AST is not implemented yet的错误 (Bun issue #5271)
export const getTheme = () => {
  const theme = resolveConfig(tailwindConfig).theme;
  return {
    screens: theme.screens,
  };
};
