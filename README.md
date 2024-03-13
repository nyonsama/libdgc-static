# libdgc-static

个人博客。

https://libdgc.club

## 构建

先安装好 [`bun`](https://bun.sh/)，然后

```sh
bun i
bun run build-all-post # 构建文章附带的代码
bun run serve # 启动http服务器
bun --hot build.tsx # 渲染页面并监听代码改动
```

build.tsx偶尔会报找不到css文件的错误，遇到的话多按一下command+s就不报了，未来可能会修复这个问题
