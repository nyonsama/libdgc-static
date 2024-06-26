---
title: "在浏览器中实现水平仪"
createDate: "2023-12-25"
tags: ["Web", "玩具"]
---

## 2024-03-05更新

iOS Safari可以使用`devicemotion`，详见下文

## 简介

为了试玩 Vue3 和浏览器的传感器 API 做了这个东西。

## Showcase

请使用手机查看。

<iframe style="width:100%;height:600px" src="./dist/index.html"></iframe>

## 如何实现

挑选API读传感器数据，转换成 CSS transform 展示到页面上

### 读传感器

浏览器对传感器的支持比较有限。可用的 API 如下：

| API                         | 能拿到的数据   | 文档                                                                                   |
| --------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `devicemotion` 事件         | 加速度、角速度 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicemotion_event)      |
| `deviceorientation` 事件    | 设备朝向       | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event) |
| `GravitySensor`             | 加速度         | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/GravitySensor)                  |
| `RelativeOrientationSensor` | 设备朝向       | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/RelativeOrientationSensor)      |

其他用不到的就不列在这里了。

在上面几个 API 中，Safari ~~出于隐私问题，哪个都不支持~~和 Firefox 支持前两个事件；Chrome 全都支持。其中 Safari 需要调用`DeviceMotionEvent.requestPermission()`请求权限后才能使用。

实现水平仪需要计算设备与水平面的夹角。用这 4 个 API 中任意一个都可以，不过默认使用 `GravitySensor`、使用 `devicemotion` 兜底最合适。原因：

- `GravitySensor` 只使用加速度传感器；而另外三个要同时使用加速度传感器和陀螺仪，需要的权限比较大，理论上耗电也多一点
- `GravitySensor` 和 `devicemotion` 提供的加速度数据格式相同，都是三个轴上的加速度（m/s<sup>2</sup>），写代码比较方便
- `RelativeOrientationSensor` 以四元数的格式提供数据，使用起来可能不方便
- 这两个能覆盖所有现代浏览器

### 计算

主要有两个功能点：

- 小圆圈的位置变化
- 设置当前状态为水平面

#### 小圆圈位置计算

水平仪可以看作一个从上往下看的球，里面装了水，有个小气泡浮在最上面。

将加速度 a 归一化之后，可以得到一个**从原点指向单位球面上一点**的向量`[x, y, z]`；x 和 y 分别乘水平仪的半径，看起来就是小圆圈相对于中心的位置。

#### 设置当前状态为水平面

涉及三维空间中的旋转，可以使用欧拉角、四元数或矩阵来计算。参见：[三维旋转（知乎）](https://zhuanlan.zhihu.com/p/135951128)、[怎样使用单位四元数旋转一个向量（StackExchange）](https://math.stackexchange.com/questions/40164/how-do-you-rotate-a-vector-by-a-unit-quaternion)

因为我自己都一知半解，所以不进一步介绍了。[仓库地址](https://github.com/nyonsama/libdgc-static/tree/main/packages/play-accelerometer)
