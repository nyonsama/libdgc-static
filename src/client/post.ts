// import { signal, effect, computed, batch } from "@preact/signals-core";
import { signal, effect, computed, batch } from "../../node_modules/@preact/signals-core/src/index";
import { getTheme } from "../macros/tailwindConfig" with { type: "macro" };
if (typeof Bun !== "undefined") {
  throw 'i am in bun'
}

// https://stackoverflow.com/a/57876601
const adjustedBoundingRect = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const tx = style.transform;
  if (!tx) {
    return rect
  }
  let sx, sy, dx, dy;
  if (tx.startsWith('matrix3d(')) {
    const ta = tx.slice(9, -1).split(/, /);
    sx = +ta[0];
    sy = +ta[5];
    dx = +ta[12];
    dy = +ta[13];
  } else if (tx.startsWith('matrix(')) {
    const ta = tx.slice(7, -1).split(/, /);
    sx = +ta[0];
    sy = +ta[3];
    dx = +ta[4];
    dy = +ta[5];
  } else {
    return rect;
  }
  const to = style.transformOrigin;
  const x = rect.x - dx - (1 - sx) * parseFloat(to);
  const y = rect.y - dy - (1 - sy) * parseFloat(to.slice(to.indexOf(' ') + 1));
  const w = sx ? rect.width / sx : rect.width;
  const h = sy ? rect.height / sy : rect.height;
  return { x, y, width: w, height: h, top: y, right: x + w, bottom: y + h, left: x };
}

const theme = getTheme()

const lgQuery = window.matchMedia(`(min-width:${theme.screens.lg})`)
const screenIsLg = signal(lgQuery.matches)
lgQuery.addEventListener('change', () => {
  screenIsLg.value = lgQuery.matches
})

const showSidebar = signal(false)
{
  const element = document.getElementById('sidebar')!
  effect(() => {
    if (showSidebar.value) {
      // 设置tailwindcss class会导致给好几十个元素布局，不知道为什么
      // 改成直接设置style来优化
      element.style.transform = 'translateX(-100%)'
    } else {
      if (screenIsLg.peek()) {
        element.style.transition = 'none'
        element.style.transform = 'none'
        void (element.offsetTop); // trigger a reflow
        element.style.transition = ''
      }
      element.style.transform = 'none'
    }
  })

  // 视口变宽时关掉sidebar
  effect(() => {
    if (screenIsLg.value) {
      showSidebar.value = false
    }
  })

  const tocButton = document.getElementById("button-show-toc")! as HTMLDivElement;
  tocButton.addEventListener("click", () => {
    showSidebar.value = true
  });
}


const html = document.documentElement
const pageSize = signal({
  height: html.clientHeight,
  width: html.clientWidth
})
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { target } = entry
    if (target.tagName.toLowerCase() === 'html') {
      const { inlineSize, blockSize } = entry.contentBoxSize[0]
      pageSize.value = { height: blockSize, width: inlineSize }
    }
  }
})
Promise.resolve().then(() => {
  resizeObserver.observe(html)
})


// 点击图片放大
const imagePreview = signal({
  show: false,
  element: document.querySelector('.post img')! as HTMLImageElement
})
const showPreview = (element: HTMLImageElement) => {
  if (!imagePreview.value.show) {
    imagePreview.value = { show: true, element }
  }
}
const hidePreview = () => {
  const { show, element } = imagePreview.value
  if (show) {
    imagePreview.value = { show: false, element }
  }
}
{
  const imageTransform = computed(() => {
    const { show, element } = imagePreview.value
    if (!show) {
      return 'none'
    }
    const offsetParentRect = element.offsetParent!.getBoundingClientRect()
    // console.log('offset', {
    //   x: offsetParentRect.x + element.offsetLeft,
    //   y: offsetParentRect.y - element.offsetTop,
    //   width: element.offsetWidth,
    //   height: element.offsetHeight
    // })
    const x = offsetParentRect.x + element.offsetLeft;
    const y = offsetParentRect.y - element.offsetTop;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    // const { x, y, width, height } = element.parentElement!.getBoundingClientRect()
    // console.log('parent', { x, y, width, height })
    // console.log('computed', adjustedBoundingRect(element))
    const { width: htmlWidth, height: htmlHeight } = pageSize.value
    // console.log({ x, y, width, height }, { htmlWidth, htmlHeight })
    console.log()
    const scale = `scale(${Math.min(htmlWidth / width, htmlHeight / height, 4)})`;
    const tx = -x + htmlWidth / 2 - width / 2
    const ty = -y + htmlHeight / 2 - height / 2
    return `translate(${tx}px,${ty}px) ${scale}`;
  })


  // toggle图片预览
  let firstRun = true
  effect(() => {
    const { show, element } = imagePreview.value
    if (firstRun) {
      firstRun = false
    } else if (show) {
      element.style.zIndex = '20'
      showNavbar.value = false
      // element.setAttribute("title", "点击取消预览"); // 把title改成alt
      // 放大之后临时禁用transition
      const disableTransition = () => {
        element.style.transition = 'none'
      }
      element.addEventListener('transitionend', disableTransition, { once: true })
      return () => element.removeEventListener('transitionend', disableTransition)
    } else {
      element.style.transition = ''
      element.style.transform = 'none'
      // element.setAttribute("title", "点击预览");
      showNavbar.value = true
      resizeObserver.unobserve(element.parentElement!)
      const clearZIndex = () => {
        element.style.zIndex = "";
      }
      element.addEventListener('transitionend', clearZIndex, { once: true })
      return () => element.removeEventListener('transitionend', clearZIndex)
    }
  })

  // 展示预览的时候把imageTransform和元素的transform绑定
  effect(() => {
    const { element } = imagePreview.peek()
    // NOTE: 不需要把订阅signal的代码放到前面
    // if (show) {
    element.style.transform = imageTransform.value
    // }
  })

  // init image preview
  const postImages = document.querySelectorAll(".post img");
  for (let index = 0; index < postImages.length; index++) {
    const element = postImages[index] as HTMLImageElement;
    // element.setAttribute("title", "点击预览");
    element.addEventListener("click", () => {
      if (imagePreview.value.show) {
        hidePreview()
      } else {
        showPreview(element)
      }
    });
  }
}


// control page scroll
// const allowScroll = signal(true)
const allowScroll = computed<boolean>(() => {
  return !imagePreview.value.show
})
{
  effect(() => {
    if (allowScroll.value) {
    } else {
      html.style.overflow = 'hidden'
      return () => {
        html.style.overflow = ''
      }

    }
  })
}


const showBackdrop = computed(() => {
  return showSidebar.value || imagePreview.value.show
})
{
  const element = document.getElementById('backdrop')!
  element.addEventListener('click', () => {
    hidePreview()
    showSidebar.value = false
  })

  let firstRun = true
  effect(() => {
    if (showBackdrop.value) {
      element.classList.remove('pointer-events-none', 'opacity-0')
      element.classList.add('opacity-50')
    } else if (firstRun) {
      // HACK: 避免初始状态触发effect
      firstRun = false
    } else {
      element.classList.add('pointer-events-none', 'opacity-0')
      element.classList.remove('opacity-50')
    }
  })
}

// controll navbar
const showNavbar = signal(true)
{
  const navbar = document.getElementById('navbar')!
  effect(() => {
    if (showNavbar.value) {
      navbar.style.transform = ""
    } else {
      navbar.style.transform = "translateY(-100%)";
    }
  })
}

const scrollState = signal({
  state: 'idle' as 'idle' | 'up' | 'down',
  distance: 0
})
// 根据滚动展示或隐藏navbar
{
  let lastWindowScrollY = window.scrollY;
  window.addEventListener("scroll", () => {
    const { state, distance } = scrollState.value
    const delta = window.scrollY - lastWindowScrollY;
    lastWindowScrollY = window.scrollY;
    const newState: typeof state = delta > 0 ? 'down' : delta < 0 ? 'up' : 'idle'
    const newDistance = state === newState ? distance + Math.abs(delta) : Math.abs(delta)
    scrollState.value = { state: newState, distance: newDistance }
  });
  window.addEventListener("scrollend", () => {
    lastWindowScrollY = window.scrollY;
    scrollState.value = { state: 'idle', distance: scrollState.value.distance };
  });

  effect(() => {
    const { state, distance } = scrollState.value
    // 此处写死navbar高度为48
    if (state === 'down' && distance > 48) {
      showNavbar.value = false
    } else if (state === 'up' && distance > 8) {
      showNavbar.value = true
    }
    // TODO: 滚动到顶时不隐藏
  })
}
