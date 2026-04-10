import { inject } from "@vercel/analytics";

export const waitDOMContentLoaded = async () => {
  if (document.readyState !== "loading") {
    return;
  }
  await new Promise<void>((resolve) => {
    window.addEventListener(
      "DOMContentLoaded",
      () => {
        resolve();
      },
      { once: true },
    );
  });
};

export const delay = async (duration: number) => {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), duration));
};

export const injectAnalytics = () => {
  const url = new URL(location.href);
  if (url.host.includes("libdgc.club")) {
    inject();
  }
};
