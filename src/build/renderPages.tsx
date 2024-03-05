import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs/promises";
import path from "node:path";
import { IndexPage, IndexProps } from "../pages";
import { PostPage } from "../pages/post";
import { ReactElement } from "react";
import Page404 from "../pages/404";
import { generateAbstractFromHtml, renderMarkdown } from "../utils";
import ListPage from "../pages/list";
import { getJsUrlPathByPage } from ".";
import { RenderContext } from "../contexts/renderContext";

const urlPathToFilePath = (urlPath: string, base?: string) => {
  const isIndex = urlPath.endsWith("/");
  const hasExt = /\..+$/.test(urlPath);
  let absolute;
  if (hasExt) {
    absolute = urlPath; // /page.html -> /page.html
  } else if (isIndex) {
    absolute = `${urlPath}index.html`; // /path/to/page/ -> /path/to/page/index.html
  } else {
    absolute = `${urlPath}.html`; // /path/to/page -> /path/to/page.html
  }
  const relative = absolute.replace(/^\//, "");
  const parsedPath = path.posix.parse(relative);
  const filePath = path.format(parsedPath);
  if (base) {
    return path.join(base, filePath);
  } else {
    return filePath;
  }
};

const renderPage = async (
  urlPath: string,
  component: ReactElement,
  context?: { jsPaths?: string[] },
) => {
  if (!cssBundlePath) {
    throw new Error("cssBundlePath is null");
  }
  const componentWithContext = (
    <RenderContext.Provider
      value={{
        assetPaths: { css: [cssBundlePath], js: context?.jsPaths ?? [] },
      }}
    >
      {component}
    </RenderContext.Provider>
  );
  const html = `<!DOCTYPE html>${renderToStaticMarkup(componentWithContext)}`;
  const filePath = urlPathToFilePath(urlPath, "dist");
  const fileDir = path.dirname(filePath);
  await fs.mkdir(fileDir, { mode: 0o755, recursive: true });
  await fs.writeFile(filePath, html);
  console.log(`🟢${urlPath}`);
  return;
};

const renderPost = async (postPath: string) => {
  const filePath = path.join(postPath, "index.md");
  const mdString = (await fs.readFile(filePath)).toString("utf8");
  const { frontMatter, toc, html } = await renderMarkdown(mdString, postPath);
  if (!frontMatter.title) {
    throw new Error(`${postPath} title is empty`);
  }
  if (!frontMatter.createDate) {
    throw new Error(`${postPath} createDate is empty`);
  }
  return {
    metadata: {
      toc,
      ...frontMatter,
    },
    html,
  };
};

const renderPostPages = async () => {
  // post pages
  const postDataList: IndexProps["posts"] = [];
  const postNames = await fs.readdir("posts");
  const jsBundlePath = await getJsUrlPathByPage("post");
  const renderTasks = postNames.map(async (post) => {
    const postSourcePath = path.join("posts", post);
    const { metadata, html } = await renderPost(postSourcePath);
    const abstract = await generateAbstractFromHtml(html);
    const postData = {
      metadata,
      html,
      abstract,
      path: `/posts/${post}/`,
    };
    await renderPage(
      `/posts/${post}/index.html`,
      <PostPage post={postData} />,
      { jsPaths: [jsBundlePath] },
    );
    postDataList.push(postData);

    // copy post assets
    const postDistPath = path.join("dist", "posts", post);
    // Bun issue #9124: 递归cp相对路径会报错，这里拼成绝对路径
    // TODO: 等bun修复之后改回相对路径
    await fs.cp(`${process.cwd()}/${postSourcePath}`, postDistPath, {
      recursive: true,
    });

    // remove markdown file
    const indexMdPath = path.join(postDistPath, "index.md");
    const exist = await fs
      .access(indexMdPath)
      .then(() => true)
      .catch(() => false);
    if (exist) {
      await fs.rm(indexMdPath);
    }
  });
  await Promise.all(renderTasks);
  return postDataList;
};

const postsPerPage = 10;
const renderIndexPage = async (postDataList: IndexProps["posts"]) => {
  const totalPages = Math.ceil(postDataList.length / postsPerPage);
  postDataList.sort(
    (a, b) =>
      new Date(b.metadata.createDate).valueOf() -
      new Date(a.metadata.createDate).valueOf(),
  );
  await renderPage(
    "/",
    <IndexPage
      posts={postDataList.slice(0, postsPerPage)}
      pagination={{ current: 0, total: totalPages }}
    />,
  );
};

const renderListPages = async (postDataList: IndexProps["posts"]) => {
  const totalPages = Math.ceil(postDataList.length / postsPerPage);
  const renderTasks: Promise<void>[] = [];
  for (let index = 0; index < totalPages; index++) {
    const posts = postDataList.slice(
      index * postsPerPage,
      (index + 1) * postsPerPage,
    );
    const pagination = { current: index, total: totalPages };
    renderTasks.push(
      renderPage(`/list/${index + 1}`, <ListPage {...{ pagination, posts }} />),
    );
  }
  await Promise.all(renderTasks);
};

// TODO: 实现一个assets getter，只在需要js或css的时候等待
// 可能用处不太大？
let cssBundlePath: string | null = null;
export const renderAllPages = async () => {
  const cssFiles = await fs.readdir("dist/assets/css");
  const cssBundleFile =
    cssFiles.find((filename) => filename.match(/^style-.*\.css$/)) ?? null;
  cssBundlePath = `/assets/css/${cssBundleFile}`;

  const postDataList = await renderPostPages();
  await Promise.all([
    renderPage("/404", <Page404 />),
    renderIndexPage(postDataList),
    renderListPages(postDataList),
  ]);
  // TODO: 每次修改代码都都重新渲染所有post会不会慢
};
