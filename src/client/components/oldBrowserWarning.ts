export const component = {
  attach() {
    const element = document.getElementById("old-browser-warning")!;
    const button = document.getElementById("old-browser-warning-button")!;
    if (!Reflect.has(Array.prototype, "at")) {
      // https://caniuse.com/mdn-javascript_builtins_array_at
      element.setAttribute("data-show", "");
    }
    button.addEventListener("click", () => {
      element.removeAttribute("data-show");
    });
  },
};

export default component;
