export const component = {
  attach() {
    if (Reflect.has(Array.prototype, "at")) {
      // https://caniuse.com/mdn-javascript_builtins_array_at
      // 浏览器够新，返回
      return;
    }
    const element = document.getElementById("old-browser-warning")!;
    const button = document.getElementById("old-browser-warning-button")!;
    const storageKey = "showOldBrowserWarningDate";
    const lastTimestamp = +(localStorage.getItem(storageKey) ?? 0);
    const day1 = 1 * 24 * 60 * 60 * 1000;
    // 关闭后1天内不再展示
    if (Date.now() - lastTimestamp > day1) {
      element.setAttribute("data-show", "");
    }
    button.addEventListener("click", () => {
      element.removeAttribute("data-show");
      localStorage.setItem(storageKey, `${Date.now()}`);
    });
  },
};

export default component;
