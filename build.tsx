import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs/promises";
import path from "node:path";
import { IndexPage, IndexProps } from "./src/pages";
import { PostPage } from "./src/pages/post";
import { ReactElement } from "react";
import Page404 from "./src/pages/404";
import { renderMarkdown } from "./src/build";
import ListPage from "./src/pages/list";

const paths = {
  dist: path.join(process.cwd(), "dist"),
  public: path.join(process.cwd(), "public"),
  posts: path.join(process.cwd(), "posts"),
};

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

const renderPage = async (urlPath: string, component: ReactElement) => {
  const html = renderToStaticMarkup(component);
  const filePath = urlPathToFilePath(urlPath, paths.dist);
  const fileDir = path.dirname(filePath);
  await fs.mkdir(fileDir, { mode: 0o755, recursive: true });
  await fs.writeFile(filePath, html);
  console.log(`🟢${urlPath}`);
  return;
};

const renderPost = async (postPath: string) => {
  const filePath = path.join(postPath, "index.md");
  const mdString = (await fs.readFile(filePath)).toString("utf8");
  const { frontMatter, toc, html } = await renderMarkdown(mdString);
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

const renderAll = async () => {
  await renderPage("/404", <Page404 />);
  const postDataList: IndexProps["posts"] = [];
  const postNames = await fs.readdir(paths.posts);
  for (const post of postNames) {
    // render posts
    const postSourcePath = path.join(paths.posts, post);
    const { metadata, html } = await renderPost(postSourcePath);
    const postData = {
      metadata,
      html,
      path: `/posts/${post}/`,
    };
    await renderPage(`/posts/${post}/index.html`, <PostPage post={postData} />);
    postDataList.push(postData);

    // copy post assets
    const postDistPath = path.join(paths.dist, "posts", post);
    await fs.cp(postSourcePath, postDistPath, { recursive: true });

    // remove useless markdown file
    const indexMdPath = path.join(postDistPath, "index.md");
    const exist = await fs
      .access(indexMdPath)
      .then(() => true)
      .catch(() => false);
    if (exist) {
      await fs.rm(indexMdPath);
    }
  }

  // render index page
  const postsPerPage = 10;
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

  // render post list page
  for (let index = 0; index < totalPages; index++) {
    const posts = postDataList.slice(
      index * postsPerPage,
      (index + 1) * postsPerPage,
    );
    const pagination = { current: index, total: totalPages };
    await renderPage(
      `/list/${index + 1}`,
      <ListPage {...{ pagination, posts }} />,
    );
  }
};

const copyPublicFiles = async () => {
  try {
    await fs.cp(
      "node_modules/highlight.js/styles/github-dark.min.css",
      path.join(paths.dist, "github-dark.min.css"),
    );
    const files = await fs.readdir(paths.public);
    for (const fileName of files) {
      const filePath = path.join(paths.public, fileName);
      const distFilePath = path.join(paths.dist, fileName);
      await fs.cp(filePath, distFilePath);
    }
  } catch (err) {
    console.error(err);
  }
};

(async () => {
  await renderAll();
  await copyPublicFiles();
})();

// TODO: 只渲染有改动的东西
