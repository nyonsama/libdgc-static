import { effect, type Signal } from "@preact/signals-core";
export default {
  element: null as HTMLElement | null,
  attach() {
    this.element = document.getElementById("backdrop")!;
  },
  bindShow(signal: Signal<boolean>) {
    effect(() => {
      if (signal.value) {
        this.element!.setAttribute("data-show", "");
      } else {
        this.element!.removeAttribute("data-show");
      }
    });
  },
  onClick(cb: () => any) {
    this.element!.addEventListener("click", cb);
  },
};
