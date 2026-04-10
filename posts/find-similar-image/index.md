---
title: "找相似图片"
createDate: "2026-04-10"
tags: ["Vibe Coding", "工具"]
---

## （95%代码是 AI 生成的）demo

<iframe style="width:100%;height:40rem;" src="./assets/embed.html"></iframe>

在第一个输入框添加参考图片，在第二个输入框添加一堆图片（目录也可以），它会找出和参考图片相似的图片，按相似度排序。

## Why

前端开发中经常需要添加图标。新增的 UI 时不时会用到之前用过的图标。为了复用、节省空间，需要找到之前用的图片。我嫌麻烦，所以想办法整了上面这个 demo。

## 一点声明

源码中的 `opencv.js` 是从 [这里](https://docs.opencv.org/4.12.0/opencv.js)下载的。

`app.js` 和 `embed.html` 的大部分代码由 LLM 生成。

使用了 Roo code、OpenRouter、GLM5.1。

正文没有使用 LLM。
