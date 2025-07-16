export default {
  wrapperList: [] as HTMLElement[],
  attach() {
    this.wrapperList = Array.from(
      document.querySelectorAll(".post .iframe-wrapper"),
    );
    for (const wrapper of this.wrapperList) {
      const iframe = wrapper.children[0] as HTMLIFrameElement;
      const isLoading = iframe.contentWindow?.document.readyState === "loading";
      if (isLoading) {
        wrapper.setAttribute("data-loading", "");
        iframe.addEventListener("load", () => {
          wrapper.removeAttribute("data-loading");
        });
      }
    }
  },
};
