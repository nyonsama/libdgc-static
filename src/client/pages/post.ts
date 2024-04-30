import { signal, effect, computed, batch, Signal } from "@preact/signals-core";
import oldBrowserWarning from "../components/oldBrowserWarning";
import backdrop from "../components/backdrop";
import navbar from "../components/navbar";
import { noBun, waitDOMContentLoaded } from "../utils";

noBun();

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
    tocButton.addEventListener("click", () => {
      showSidebar.value = true;
    });
  }

  const html = document.documentElement;
  const pageSize = signal({
    height: html.clientHeight,
    width: html.clientWidth,
  });
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { target } = entry;
      if (target.tagName.toLowerCase() === "html") {
        const { inlineSize, blockSize } = entry.contentBoxSize[0];
        pageSize.value = { height: blockSize, width: inlineSize };
      }
    }
  });
  Promise.resolve().then(() => {
    resizeObserver.observe(html);
  });

  // 点击图片放大
  const imagePreview = signal({
    show: false,
    element: document.querySelector(".post img")! as HTMLImageElement,
  });
  const showPreview = (element: HTMLImageElement) => {
    if (!imagePreview.value.show) {
      imagePreview.value = { show: true, element };
    }
  };
  const hidePreview = () => {
    const { show, element } = imagePreview.value;
    if (show) {
      imagePreview.value = { show: false, element };
    }
  };
  {
    const imageTransform = computed(() => {
      const { show, element } = imagePreview.value;
      if (!show) {
        return "none";
      }
      const offsetParentRect = element.offsetParent!.getBoundingClientRect();
      const x = offsetParentRect.x + element.offsetLeft;
      const y = offsetParentRect.y - element.offsetTop;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const { width: htmlWidth, height: htmlHeight } = pageSize.value;
      const scale = `scale(${Math.min(
        htmlWidth / width,
        htmlHeight / height,
        4,
      )})`;
      const tx = -x + htmlWidth / 2 - width / 2;
      const ty = -y + htmlHeight / 2 - height / 2;
      return `translate(${tx}px,${ty}px) ${scale}`;
    });

    // toggle图片预览
    let firstRun = true;
    effect(() => {
      const { show, element } = imagePreview.value;
      if (firstRun) {
        firstRun = false;
        return;
      }
      showNavbar.value = !show;
      const nextState = show ? "fadeIn" : "fadeOut";
      const endState = show ? "active" : "inactive";
      element.setAttribute("data-state", nextState);
      const bindState = () => {
        element.setAttribute("data-state", endState);
      };
      element.addEventListener("transitionend", bindState, { once: true });
      return () => element.removeEventListener("transitionend", bindState);
    });

    // 展示预览的时候把imageTransform和元素的transform绑定
    effect(() => {
      const { element } = imagePreview.peek();
      if (element) {
        element.style.transform = imageTransform.value;
      }
    });

    // init image preview
    const postImages = document.querySelectorAll(".post figure > img");
    for (let index = 0; index < postImages.length; index++) {
      const element = postImages[index] as HTMLImageElement;
      element.addEventListener("click", () => {
        if (imagePreview.value.show) {
          hidePreview();
        } else {
          showPreview(element);
        }
      });
    }
  }

  // control page scroll
  const allowScroll = computed<boolean>(() => {
    return !imagePreview.value.show;
  });
  {
    const stopProp = (e: Event) => {
      e.preventDefault();
    };
    effect(() => {
      if (allowScroll.value) {
        document.removeEventListener("touchmove", stopProp);
        html.style.overflow = "";
      } else {
        // ios safari需要额外阻止一下touchmove事件
        document.addEventListener("touchmove", stopProp, { passive: false });
        html.style.overflow = "hidden";
      }
    });
  }

  const showBackdrop = computed(() => {
    return showSidebar.value || imagePreview.value.show;
  });
  {
    backdrop.attach();
    backdrop.onClick(() => {
      hidePreview();
      showSidebar.value = false;
    });
    backdrop.bindShow(showBackdrop);
  }

  // control navbar
  const showNavbar = signal(true);
  {
    navbar.attach();
    navbar.bindShow(showNavbar);
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
      // TODO: 滚动到顶时不隐藏
    });
  }

  oldBrowserWarning.attach();
})();
