import { createContext } from "react";
export interface RenderContextValue {
  assetPaths: {
    css: string[];
    js: string[];
  };
}

export const RenderContext = createContext<RenderContextValue>({
  assetPaths: { css: [], js: [] },
});
