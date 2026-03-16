import { signal, effect, computed, batch, Signal } from "@preact/signals-core";
import backdrop from "../components/backdrop";
import navbar from "../components/navbar";
import { delay, injectAnalytics, waitDOMContentLoaded } from "../utils";

(async () => {
  await waitDOMContentLoaded();

  // const theme = getTheme();

  // 1024px
  const lgQuery = window.matchMedia(`(min-width:1024px)`);
  const screenIsLg = signal(lgQuery.matches);
  lgQuery.addEventListener("change", () => {
    screenIsLg.value = lgQuery.matches;
  });

  const showSidebar = signal(false);
  {
    const element = document.getElementById("sidebar")!;
    effect(() => {
      if (showSidebar.value) {
        element.setAttribute("data-show", "");
      } else {
        element.removeAttribute("data-show");
      }
    });

    const links = element.querySelectorAll("a");
    for (const link of links) {
      link.addEventListener("click", () => {
        showSidebar.value = false;
      });
    }

    let lastScreenIsLgValue: boolean | null = null;
    // 视口变宽时关掉sidebar
    effect(() => {
      const { value } = screenIsLg;
      if (lastScreenIsLgValue !== value && value) {
        showSidebar.value = false;
      }
      lastScreenIsLgValue = value;
    });

    const tocButton = document.getElementById(
      "button-show-toc",
    )! as HTMLDivElement;
    tocButton.addEventListener("click", (e) => {
      e.stopPropagation();
      showSidebar.value = true;
    });
  }

  const showBackdrop = computed(() => {
    return showSidebar.value;
  });
  {
    backdrop.attach();
    backdrop.onClick(() => {
      showSidebar.value = false;
    });
    backdrop.bindShow(showBackdrop);
  }

  // control navbar
  const showNavbar = signal(true);
  {
    navbar.attach();
    navbar.bindShow(showNavbar);

    navbar.element!.addEventListener("click", () => {
      showSidebar.value = false;
    });
  }

  const scrollState = signal({
    state: "idle" as "idle" | "up" | "down",
    distance: 0,
  });
  // 根据滚动展示或隐藏navbar
  {
    let lastWindowScrollY = window.scrollY;
    window.addEventListener("scroll", () => {
      const { state, distance } = scrollState.value;
      const delta = window.scrollY - lastWindowScrollY;
      lastWindowScrollY = window.scrollY;
      const newState: typeof state =
        delta > 0 ? "down" : delta < 0 ? "up" : "idle";
      const newDistance =
        state === newState ? distance + Math.abs(delta) : Math.abs(delta);
      scrollState.value = { state: newState, distance: newDistance };
    });
    window.addEventListener("scrollend", () => {
      lastWindowScrollY = window.scrollY;
      scrollState.value = {
        state: "idle",
        distance: scrollState.value.distance,
      };
    });

    effect(() => {
      const { state, distance } = scrollState.value;
      // 此处写死navbar高度为48
      if (state === "down" && distance > 48) {
        showNavbar.value = false;
      } else if (state === "up" && distance > 8) {
        showNavbar.value = true;
      }
    });
  }

  // 复制按钮
  {
    const copyButtons = document.querySelectorAll(".prose button.code-copy");
    for (const button of copyButtons) {
      const code = button.parentElement?.parentElement?.querySelector("code");
      if (!code?.textContent) {
        continue;
      }
      let endTime = 0;
      button.addEventListener("click", async () => {
        await navigator.clipboard.writeText(code.textContent);
        const duration = 1000;
        endTime = performance.now() + duration;
        button.textContent = "已复制";
        await delay(duration);
        if (performance.now() > endTime) {
          button.textContent = "复制";
        }
      });
    }
  }

  {
    const tocItems = [
      ...document.querySelectorAll(".toc-item"),
    ] as HTMLElement[];
    const headerInfoMap = new Map(
      tocItems.map((item) => [
        item.getAttribute("href")!.replace(/^#/, ""),
        { toc: item },
      ]),
    );

    const options = {
      root: null,
      rootMargin: "-48px 0px -48px 0px",
      scrollMargin: "0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = encodeURIComponent(entry.target.children[0]?.id);
        const headerInfo = headerInfoMap.get(id);
        if (headerInfo) {
          if (entry.isIntersecting) {
            headerInfo.toc.setAttribute("data-highlight", "");
          } else {
            headerInfo.toc.removeAttribute("data-highlight");
          }
        }
      }
    }, options);

    const headers = document.querySelectorAll(".prose :is(h2, h3, h4, h5, h6)");
    for (const element of headers) {
      if (element.parentElement?.tagName.toLowerCase() === "section") {
        observer.observe(element.parentElement);
      }
    }
  }

  injectAnalytics();
})();
