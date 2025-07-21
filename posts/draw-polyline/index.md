---
title: "尝试在地图上画折线"
createDate: "2025-07-17"
tags: ["Web"]
---

目标: 在地图上

- 画圆拐角的实线
- 画虚线，其中每一节是圆角矩形

## 使用地图SDK自带的API

以高德地图为例。
[官方文档](https://lbs.amap.com/api/javascript-api-v2/documentation#polyline)
[官方示例](https://lbs.amap.com/demo/javascript-api-v2/example/overlayers/polyline-draw)

总结：

🟢 经过实战考验

🟢 使用方便

🟡 折线有时会被过度简化

🔴 对虚线支持有限

![从官方示例截的图，展示了自定义折线的拐角、描边、线帽、虚线样式](./amap_polyline.png)

如图，能画圆角。但是翻过文档之后发现，画不了我需要的虚线。

还有个问题：折线会被自动简化，并且简化的程度无法调整。
如果用以下代码画一条正弦曲线：

```js
// 使用const会在重新运行代码的时候报错，只好用var
var myPath = [...Array(1000)].map((_, index) => {
  const offset = 0.0001 * index;
  return [
    116.81213378906249 + offset + 0.01,
    40.01499435375046 + Math.sin(offset),
  ];
});
var myPolyline = new AMap.Polyline({
  path: myPath,
  strokeColor: "#3366FF",
  strokeOpacity: 1,
  strokeWeight: 2,
  zIndex: 500,
});
map.add(myPolyline);
```

效果会是这样：

![放大的时候看起来还好](./amap_sin_close.png)

![缩小之后就只剩几个线段了](./amap_sin_far.png)

要在线预览的话，可以使用高德地图的示例自带的代码编辑器，直接把刚才的代码粘贴到官方示例代码的底部来预览。

## 开源库: regl-line2d

## 不好用: pixijs three

## 在更进一步之前

墨卡托投影
缩放级别的定义
经纬度坐标、容器坐标、像素坐标
测试数据：https://mourner.github.io/simplify-js/website/test-data.js

### 数学库

math.gl x
@pixi/math x
three x
turf x
gl-matrix o

### 工具

regl(amap也在用)
simply.js
turfjs?
polyline-normals
lineclip

## 手搓

### Canvas

roundRect
避免alloc、避免external api call

### WebGL

https://webgl2fundamentals.org/

#### Instanced drawing

#### 生成mesh

gl-matrix
simply.js
canvas-roundrect-polyfill
regl
regl-line2d

没用到的
lineclip
turfjs
@mapbox
mathjs
math.gl
@pixi/math
threejs math

https://wwwtyro.net/2019/11/18/instanced-lines.html

https://wwwtyro.net/2021/10/01/instanced-lines-part-2.html

https://mattdesl.svbtle.com/drawing-lines-is-hard
polyline-normals
