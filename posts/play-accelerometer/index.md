---
title: "在浏览器中实现水平仪"
createDate: "2023-12-25"
tags: ["Web", "玩具"]
---

## 简介

为了试玩 Vue3 和浏览器的传感器 API 做了这个东西。

## Showcase

请使用手机查看。~~不支持 Safari~~

<iframe style="width:100%;height:600px" src="./dist/index.html"></iframe>

## 如何实现

读传感器数据，处理后展示到页面上

### 读传感器

浏览器对传感器的支持比较有限。可用的 API 如下：

| API                         | 能拿到的数据   | 文档                                                                                   |
| --------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `devicemotion` 事件         | 加速度、角速度 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicemotion_event)      |
| `deviceorientation` 事件    | 设备朝向       | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event) |
| `GravitySensor`             | 加速度         | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/GravitySensor)                  |
| `RelativeOrientationSensor` | 设备朝向       | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/RelativeOrientationSensor)      |

其他用不到的就不列在这里了。

在上面几个 API 中，Safari 出于隐私问题，哪个都不支持；Firefox 只支持前两个事件；Chrome 全都支持。

实现水平仪需要计算设备与水平面的夹角。用这 4 个 API 中任意一个都可以，不过默认使用 `GravitySensor`、使用 `devicemotion` 兜底最合适。原因：

- `GravitySensor` 只使用加速度传感器；而另外三个要同时使用加速度传感器和陀螺仪，需要的权限比较大，理论上耗电也多一点
- `GravitySensor` 和 `devicemotion` 提供的加速度数据格式相同，都是三个轴上的加速度（m/s<sup>2</sup>），写代码比较方便
- 这两个能覆盖 Safari 以外的所有现代浏览器

### 计算

TL;DR: [怎样使用单位四元数旋转一个向量（StackExchange）](https://math.stackexchange.com/questions/40164/how-do-you-rotate-a-vector-by-a-unit-quaternion)

尝试看了四元数的概念，看不懂，于是直接用了上面的结论。

因为我自己就一知半解，所以不进一步介绍了。构建项目时生成了 sourcemap，建议直接 F12 看代码，有注释（
