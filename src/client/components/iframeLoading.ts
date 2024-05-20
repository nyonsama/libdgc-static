export default {
  wrapperList: [] as HTMLElement[],
  attach() {
    this.wrapperList = Array.from(
      document.querySelectorAll(".post .iframe-wrapper"),
    );
    for (const wrapper of this.wrapperList) {
      wrapper.setAttribute("data-loading", "");
      const iframe = wrapper.children[0];
      iframe.addEventListener("load", () => {
        wrapper.removeAttribute("data-loading");
      });
    }
  },
};
