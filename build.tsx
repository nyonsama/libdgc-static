import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs/promises";
import path from "node:path";
import { Index } from "./src/pages";
import { PostPage, PostPageProps } from "./src/pages/post";
import { ReactElement } from "react";
import Page404 from "./src/pages/404";

const paths = {
  dist: path.join(process.cwd(), "dist"),
  public: path.join(process.cwd(), "public"),
  posts: path.join(process.cwd(), "posts"),
};

const urlPathToFilePath = (urlPath: string, base?: string) => {
  let absolute = urlPath;
  const isIndex = urlPath.endsWith("/");
  const hasExt = /\..+$/.test(urlPath);
  if (isIndex) {
    absolute += "index.html"; // /path/to/page/ -> /path/to/page/index.html
  } else if (!hasExt) {
    absolute += ".html"; // /path/to/page -> /path/to/page.html
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
  console.log(`🟢${urlPath}\n${html}\n`);
  return;
};

const renderPost = async (filePath: string): Promise<PostPageProps> => {
  const html = `<h1>post</h1><p>${filePath}</p>`;
  return {
    post: {
      metadata: { title: "post" },
      html,
    },
  };
};

const renderAll = async () => {
  await renderPage("/", <Index />);
  await renderPage("/404", <Page404 />);

  const posts = await fs.readdir(paths.posts);
  for (const post of posts) {
    const postSourcePath = path.join(paths.posts, post);
    const postProps = await renderPost(postSourcePath);
    await renderPage(`/posts/${post}/index.html`, <PostPage {...postProps} />);

    const postDistPath = path.join(paths.dist, "posts", post);
    await fs.cp(postSourcePath, postDistPath, { recursive: true });

    const indexMdPath = path.join(postDistPath, "index.md");
    const exist = await fs
      .access(indexMdPath)
      .then(() => true)
      .catch(() => false);
    if (exist) {
      await fs.rm(indexMdPath);
    }
  }
};

const copyPublicFiles = async () => {
  try {
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
