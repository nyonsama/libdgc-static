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

export const noBun = () => {
  // HACK: 不让bun跑这里面的代码
  // TODO: 等bun #4689 解决了就去掉
  if (typeof Bun !== "undefined") {
    throw "i am in bun";
  }
};
