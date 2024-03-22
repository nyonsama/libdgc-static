import { FC } from "react";
import IconWarning from "./IconWarning";
import { effect, signal } from "@preact/signals-core";

export const component = {
  element: null as HTMLElement | null,
  button: null as HTMLElement | null,
  show: signal(false),
  attach() {
    this.element = document.getElementById("old-browser-warning");
    this.button = document.getElementById("old-browser-warning-button");

    if (!Reflect.has(Array.prototype, "at")) {
      // https://caniuse.com/mdn-javascript_builtins_array_at
      this.show.value = true;
    }
    effect(() => {
      if (this.show.value) {
        this.element?.setAttribute("data-show", "");
      } else {
        this.element?.removeAttribute("data-show");
      }
    });
    this.button?.addEventListener("click", () => {
      this.show.value = false;
    });
  },
};

const OldBrowserWarning: FC = () => {
  return (
    <div
      id="old-browser-warning"
      className="fixed bottom-0 left-0 right-0 z-50 flex translate-y-full justify-center border-t border-yellow-400 bg-zinc-800 transition-transform data-[show]:translate-y-0"
    >
      <div className="mx-4 flex w-full items-start justify-center sm:max-w-2xl lg:max-w-4xl">
        <IconWarning className="mr-4 mt-4 h-6 w-6 text-yellow-400" />
        <p className="mr-4 flex-1 py-4">
          你的浏览器版本较低，可能无法正常显示本站页面。
        </p>
        <button
          id="old-browser-warning-button"
          className="mt-3 select-none bg-zinc-700 px-2 py-1 text-sm leading-6 hover:bg-zinc-600 active:bg-zinc-500"
        >
          OK
        </button>
      </div>
    </div>
  );
};
export default OldBrowserWarning;
