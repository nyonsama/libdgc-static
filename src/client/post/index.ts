import { signal, effect } from "@preact/signals-core";
enum ScrollState {
  rest,
  up,
  down,
}
const scrollState = signal<ScrollState>(ScrollState.rest);

let lastWindowScrollY = window.scrollY;
window.addEventListener("scroll", () => {
  const delta = window.scrollY - lastWindowScrollY;
  const currentState: ScrollState =
    delta > 0
      ? ScrollState.down
      : delta < 0
        ? ScrollState.up
        : ScrollState.rest;
  scrollState.value = currentState;
  lastWindowScrollY = window.scrollY;
});
window.addEventListener("scrollend", () => {
  scrollState.value = ScrollState.rest;
});

{
  const navbar = document.querySelector("#navbar")! as HTMLElement;

  effect(() => {
    const { rest, up, down } = ScrollState;
    switch (scrollState.value) {
      case rest:
        break;
      case up:
        setTimeout(() => (navbar.style.transform = "translateY(-100%)"), 100);
        break;
      case down:
        setTimeout(() => (navbar.style.transform = ""), 100);
        break;
    }
  });
}

enum NavbarState {
  anchored,
  hidden,
  show,
}

enum SidebarState {
  default,
  hidden,
}
const sidebarState = signal(SidebarState.default);

// const sidebarElement = document.querySelector("#sidebar")!;

const $ = document.querySelector.bind(document);

const sidebar = {
  element: $("#sidebar") as HTMLDivElement,
  show: false,
  toggle() {
    this.show = !this.show;
    if (this.show) {
      this.element.classList.remove("max-lg:translate-x-full");
    } else {
      this.element.classList.add("max-lg:translate-x-full");
    }
  },
};

class Navbar {
  element: HTMLElement;
  state = "show" as "show" | "hide";
  constructor(element: HTMLElement) {
    this.element = element;
  }
  toggle() {
    switch (this.state) {
      case "hide":
        this.element.style.transform = "";
        this.state = "show";
        break;
      case "show":
        this.element.style.transform = "translateY(-100%)";
        this.state = "hide";
        break;
      default:
        break;
    }
  }
}
const navbar = new Navbar(document.getElementById("navbar")!);

class Backdrop {
  element: HTMLElement;
  state = "hidden" as "hidden" | "appearing" | "show" | "fading";
  showClasses = ["opacity-50"];
  fadingClasses = ["opacity-0"];
  hiddenClasses = ["opacity-0", "-z-10"];
  currentClasses = ["opacity-0", "-z-10"];
  constructor(element: HTMLElement) {
    this.element = element;
    element.addEventListener("transitionend", this.onTransitionEnd.bind(this));
  }
  setClasses(classes: string[]) {
    this.element.classList.remove(...this.currentClasses);
    this.element.classList.add(...classes);
    this.currentClasses = classes;
  }
  show(zIndex: number = 10) {
    const { element, state } = this;
    switch (state) {
      case "hidden":
      case "fading":
        this.state = "appearing";
        this.setClasses(this.showClasses);
        element.style.zIndex = `${zIndex}`;
      default:
        break;
    }
  }
  hide() {
    switch (this.state) {
      case "appearing":
      case "show":
        this.state = "fading";
        this.setClasses(this.fadingClasses);
        break;

      default:
        break;
    }
  }
  toggle(zIndex?: number) {
    switch (this.state) {
      case "appearing":
      case "show":
        this.hide();
        break;
      case "hidden":
      case "fading":
        this.show(zIndex);
        break;
    }
  }
  onTransitionEnd() {
    switch (this.state) {
      case "appearing":
        this.state = "show";
        break;
      case "fading":
        this.setClasses(this.hiddenClasses);
        this.element.style.zIndex = "";
        this.state = "hidden";
        break;
    }
  }
}

const backdrop = new Backdrop(document.querySelector("#backdrop")!);

const tocButton = $("#button-show-toc") as HTMLDivElement;
tocButton.addEventListener("click", () => {
  backdrop.toggle(30);
  sidebar.toggle();
});

backdrop.element.addEventListener("click", () => {
  if (sidebar.show) {
    sidebar.toggle();
    backdrop.toggle();
  } else if (preview.isShow()) {
    preview.close();
  }
});

const html = document.documentElement;
const disableScroll = () => {
  document.body.classList.add("overflow-hidden");
};
const enableScroll = () => {
  document.body.classList.remove("overflow-hidden");
};
const preview = {
  state: "hidden" as "hidden" | "appearing" | "show" | "fading",
  element: null as HTMLImageElement | null,
  isShow() {
    return !!this.element;
  },
  onTransitionRun() {},
  onTransitionEnd() {
    switch (this.state) {
      case "fading":
        this.state = "hidden";
        this.element!.style.zIndex = "";
        break;
      case "appearing":
        this.state = "show";
      default:
        break;
    }
  },
  onTransitionCancel() {},
  toggle(element?: HTMLImageElement) {
    if (element && (this.state === "hidden" || this.state === "fading")) {
      this.show(element);
    } else if (this.state === "show" || this.state === "appearing") {
      this.close();
    }
  },
  close() {
    if (this.state === "fading" || this.state === "hidden") {
      return;
    }
    const { element } = this;
    element!.setAttribute("style", `z-index:20;`);
    navbar.toggle();
    backdrop.toggle();
    enableScroll();
    element!.setAttribute("title", "点击预览");
    this.state = "fading";
  },
  show(element: HTMLImageElement) {
    if (this.state === "appearing" || this.state === "show") {
      return;
    }
    this.element = element;

    const htmlWidth = html.clientWidth;
    const htmlHeight = html.clientHeight;
    const { x, y, width, height, right } = element.getBoundingClientRect();
    const scaleX = htmlWidth / width;
    const scaleY = htmlHeight / height;
    const scale = `scale(${Math.min(scaleX, scaleY, 4)})`;
    const translateX = `translateX(${-x + htmlWidth / 2 - width / 2}px)`;
    const translateY = `translateY(${-y + htmlHeight / 2 - height / 2}px)`;
    const transform = `transform:${translateX} ${translateY} ${scale};`;
    element.setAttribute("style", `${transform};z-index:20;`);

    disableScroll();
    navbar.toggle();
    backdrop.toggle();
    element.setAttribute("title", "点击取消预览");
    this.state = "appearing";
  },
};

const postImages = document.querySelectorAll(".post img");
for (let index = 0; index < postImages.length; index++) {
  const element = postImages[index] as HTMLImageElement;
  element.setAttribute("title", "点击预览");
  element.addEventListener("click", (e) => {
    preview.toggle(element);
  });
  element.addEventListener(
    "transitionend",
    preview.onTransitionEnd.bind(preview),
  );
}
