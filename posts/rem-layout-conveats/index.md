---
title: "rem 布局踩坑：样式冲突、宽屏适配和布局精度"
createDate: "2026-02-03"
tags: ["前端", "CSS"]
---

## TLDR

实现如下：

```css
/** 假设屏幕宽度是 750 */
html {
  font-size: calc(100vw / 750 * 100);
}
```

此时 7.5rem 等于 100vw。然而会有与外部样式冲突、屏幕太宽时不能正常展示、布局误差的问题，具体请看正文。

## 前言

为了让页面去适应不同的屏幕宽度，理想情况是为不同宽度的屏幕应用不同的样式。

但这样一来，设计、开发、测试都需要额外处理多种情况。

为了降低开发成本，一些移动端网页 / app 选择了使用 rem 布局。

## 原理

浏览器默认不会让网页的内容随着页面大小缩放。如果完全使用固定的长度来布局，同样的页面在宽屏上会留下很多空白，在窄屏上会需要横向滚动（用户体验差）。

我们可以假设屏幕宽度是固定的，比如 750 。换句话说，始终把屏幕宽度看作 750 逻辑像素（后面简称为 rpx, Reactive Pixel），使用 rpx 来布局。

这样，页面内容可以跟随屏幕宽度缩放，从而保证水平方向上的布局在不同的设备上是一致的。

屏幕高度依然不是固定的，但是可以用垂直滚动来容纳长度不定的内容。

## 实现

现在我们有了 rpx 的定义：1 rpx = 实际屏幕宽度 / 假设屏幕宽度

css 没有内置这样的长度单位。不过可以使用现有的单位（rem）来模拟。

rem 是这样定义的：1 rem = 根元素（`<html>`）的 `font-size`

所以可以根据屏幕宽度改变根元素的 `font-size`，实现把 rem 当成 rpx 用：

```css
/** 假设屏幕宽度是 750 */
html {
  font-size: calc(100vw / 750);
}
```

这样一来， 1 rem 就是 1 rpx。有点怪，毕竟一个原来比较大的单位变得比 px 还小了。因此也可以：

```css
/** 假设屏幕宽度是 750 */
html {
  font-size: calc(100vw / 750 * 100);
}
```

此时 1 rem 对应 100 rpx。正常了一点。

## 问题：与外部样式的冲突

一些组件库或 css 框架也会使用 rem 单位。然而我们（显著）改变了 rem 的大小，会导致外部样式乱掉。

### 解决办法：CSS 自定义属性、PostCSS 插件转译

为了避免污染 rem，可以把 rem 换成 css 自定义属性：

```css
/** 假设屏幕宽度是 750 */
html {
  --rpx: calc(100vw / 750);
}
.my-component {
  width: calc(var(--rpx) * 100);
}
```

这一串`calc()`写起来很麻烦。于是我找到了 [PostCSS Custom CSS Units](https://github.com/joe223/postcss-custom-css-units)：

![PostCSS Custom CSS Units 的 Readme](./assets/postcss-plugin.png)

一个可以转译自定义单位的 postcss 插件。有几年没更新了，但是还能用，并且本身就没几行代码，问题不大。

这个插件不能正确转译 `-123rpx` 之类的负值。建议把代码复制下来，照[这个 issue](https://github.com/joe223/postcss-custom-css-units/issues/3) 改一下。

## 问题：屏幕太宽

一个常见的场景是，页面顶部和底部是固定的元素，中间是滚动内容。

iPhone SE 3 屏幕的物理分辨率是宽 750 高 1334。如果页面是针对它设计的，那么在宽一点或窄一点的手机上都没问题，滚动区域能容纳这点宽高比例的差别。

但是在只能横屏的设备（电视、机顶盒、车机等）上就不一样了。（把下面的滚动条拉大一些试试）

<iframe style="width:100%;height:40rem;" src="./assets/virtual-viewport.html?content=widescreen-clip"></iframe>

滚动区域会被挤得很小，展示不了多少内容，并且难以交互。

### 临时解决办法：设置最小高度

```css
/** 假设屏幕宽度是 750 */
/** 限制页面高度至少 800 */
html {
  /* --max-rpx: calc(100vh / 800);
  --rpx: calc(100vw / 750);
  font-size: calc(min(var(--rpx), var(--max-rpx)) / 100); */

  /* 本来可以按上面的写法来的，但是 */
  /* ️css数值有精度限制，上面的font-size的计算在firefox上会产生舍入误差 */
  /* 需要让数值变大，避免舍入 */
  --max-rpx: calc(100vh / 800 * 100);
  --rpx: calc(100vw / 750 * 100);
  font-size: min(var(--rpx), var(--max-rpx));
}

/** 页面内容居中、限制宽度 */
.page-container {
  margin-left: auto;
  margin-right: auto;
  max-width: 7.5rem;
}
```

<iframe style="width:100%;height:40rem;" src="./assets/virtual-viewport.html?content=widescreen-clip&contentParams=widescreen"></iframe>

这是个凑合的方法。最多保证能够正常使用，不能保证良好的体验。

## 问题：布局误差

（请点击下面的自动演示，或者慢慢拖动滑块）

<iframe style="width:100%;height:40rem;" src="./assets/virtual-viewport.html?content=layout-error"></iframe>

有明显的抖动。

把屏幕宽度视作 750rpx 后，如果实际屏幕宽度不是 750 的整数倍，1rpx 就不能对应 1 物理像素。因此产生了误差，导致抖动。

上面的 3 个图标使用了不同的 css 来给中间的色块居中。甚至在特定的宽度下，不同的居中方式会产生不同的误差。

![上面的色块偏上，没有居中；中间的空隙偏小，下面的空隙偏大。](./assets/layout-error.png)

大部分时候，这些问题都不明显。但显然我们遇到了比较明显的情况。

上面的图是在 MacBook Pro 2022 的内置屏幕上截的。同样的问题在像素密度低一些的屏幕上很可能会更加明显。

另外，我曾经在其他平台上遇到过布局误差累积起来的情况。组件树内部的多处误差累加起来，在外层变得很明显。然而我没能在浏览器上复现出来，因此不再讨论。

### 临时解决办法：使用图片

某些小图标和圈起来的文字很容易用 css 实现。然而，正是这些小东西才更容易受布局误差影响。如果内容不会跟随数据变化，那么可以考虑使用图片。

那么如果内容需要动态变化呢？可以试一下 svg。

### 临时解决办法：缩放

某些手机游戏会按特定的分辨率渲染 UI，然后缩放到屏幕大小。一般渲染分辨率比屏幕分辨率低。在游戏上没有问题，毕竟游戏画面受性能限制，本来就以低分辨率渲染，有必要节省性能和资源。

但是移动端 app 肯定是不能这样做的，整个页面都变糊是不可接受的。所以这里只考虑以更高的分辨率布局、渲染，然后缩放到屏幕大小。

原理：把页面容器宽度设为 750 物理像素的整数倍，按照屏幕宽高比设置高度，然后用 `transform: scale()` 缩小到屏幕大小。

<iframe style="width:100%;height:40rem;" src="./assets/virtual-viewport.html?content=layout-error-scale"></iframe>

几乎没有误差和抖动了（文本可能会有一点点抖动，我认为可以忽略）。

具体实现如下：

```html
<!doctype html>
<html>
  <head>
    <style>
      html {
        /* 0.01rem对应--up-scale个css像素 */
        font-size: calc(1px * var(--up-scale) * 100);

        /* 在calc()里让两个有单位的值相除 只在很新的浏览器里支持 */
        /* https://caniuse.com/mdn-css_types_calc_typed_division_produces_unitless_number */
        /* --down-scale: calc(100vw / 7.5rem); */

        overflow: clip;
        height: 100vh;
        width: 100vw;

        outline: 1px solid white;
        outline-offset: -1px;
      }

      body {
        width: 7.5rem;

        /* 在calc()里让两个有单位的值相除 只在很新的浏览器里支持 */
        /* https://caniuse.com/mdn-css_types_calc_typed_division_produces_unitless_number */
        /* height: calc(7.5rem * 100vh / 100vw); */

        height: calc(100vh / var(--down-scale));
        transform: scale(var(--down-scale));
        transform-origin: top left;

        display: flex;
        flex-direction: column;
      }
      [data-firefox=""] body {
        /* firefox 需要一点rotate，否则依然会有布局误差，和没缩放一样 */
        transform: rotate(0.03deg) scale(var(--down-scale));
      }
      /* ... */
    </style>
  </head>
  <body>
    <!-- ... -->
    <script>
      if (navigator.userAgent.toLowerCase().includes("firefox")) {
        document.documentElement.setAttribute("data-firefox", "");
      }
      const imaginaryWidth = 750;

      // 使用window的resize事件会导致抖动
      const resizeObserver = new ResizeObserver((entries) => {
        const { inlineSize: fullWidth, blockSize: fullHeight } =
          entries?.[0]?.borderBoxSize?.[0] ?? {};
        if (!fullWidth || !fullHeight) {
          return;
        }

        // 放大倍数
        // 让0.01rem对应upScale*devicePixelRatio个物理像素
        const upScale =
          Math.ceil((fullWidth * devicePixelRatio) / imaginaryWidth) /
          devicePixelRatio;

        // 缩小倍数
        // 把放大后的容器缩小到页面大小
        const downScale = fullWidth / (imaginaryWidth * upScale);

        document.documentElement.style.setProperty("--up-scale", `${upScale}`);
        document.documentElement.style.setProperty(
          "--down-scale",
          `${downScale}`,
        );
      });
      resizeObserver.observe(document.documentElement);
    </script>
  </body>
</html>
```

#### 陷阱：firefox 的特殊优化

上面的示例在 firefox 环境下，会给页面内容添加 `rotate(0.03deg)`，不然还是会发生布局误差和抖动。我猜是因为 firefox 为了节约内存和性能，尽量避免了以过高的分辨率渲染。

## 上面所有问题的终极解决办法

放弃 rem 布局，真正地去适配不同屏幕宽度。

🤷
