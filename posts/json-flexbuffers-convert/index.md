---
title: "JSON 与 flexbuffers 相互转换"
createDate: "2025-09-16"
tags: ["Web", "flatbuffers", "工具"]
---

## 简介

简单搜了一下没找到这种在线工具，于是弄了一个。

输入框里面的文本太多会很卡，所以默认会截断，不全部展示。不想截断的话可以选中“在输入框里展示完整文件内容”。

要去掉选择的文件，可以点击选择文件后什么都不选，直接关掉弹窗。~懒得单独弄个删除按钮了~

试了下几 M 大小的文件，是没有问题的。估计好几十 M 的文件处理起来会很慢，并且需要注意内存占用。

顺便，这是第一次尝试在浏览器使用 JS 原生模块和 esm.sh CDN。近两年的 Chrome / Firefox / Safari 版本应该都支持。~别的就不好说了~

## JSON 转 FlexBuffers

<iframe src="./assets/json-to-flexbuffers.html" style="width:100%;height:592px;background:transparent" allowtransparency=true></iframe>

## FlexBuffers 转 JSON

<iframe src="./assets/flexbuffers-to-json.html" style="width:100%;height:592px;background:transparent" allowtransparency=true></iframe>
