import { renderToStaticMarkup } from "react-dom/server";
import { App } from "./src/App";
import fs from "node:fs/promises";
import path from "node:path";
import { Index } from "./src/pages";
import { PostPage } from "./src/pages/post";
import { ReactComponentElement, ReactElement } from "react";
// import { routes } from "./src/routes";

interface RouterContext {
  urlPath: string;
}
interface Route {
  path: RegExp | string;
  render: (content: RouterContext) => ReactElement | Promise<ReactElement>;
}

const routes: Route[] = [
  {
    path: "/",
    render: () => {
      return <Index />;
    },
  },
  {
    path: /^\/post/,
    render: async (content) => {
      return (
        <PostPage
          {...{
            post: {
              metadata: { title: "test post title" },
              html: "<p>some post content</p>",
            },
          }}
        />
      );
    },
  },
];

const matchRoute = (urlPath: string, ...routes: Route[]) => {
  for (const route of routes) {
    if (route.path instanceof RegExp && urlPath.match(route.path)) {
      //   return route.render();
    } else if (typeof route.path === "string" && urlPath === route.path) {
      //   return route.render();
    }
  }
  throw new Error(`no route matches url path '${urlPath}'`);
};

type PostUrlPath = {
  postData: string;
};
type UrlPath = {
  path: string;
} & (PostUrlPath | {});

const urlPathToFilePath = (urlPath: string, base?: string) => {
  const isIndex = urlPath.endsWith("/");
  const absolute = isIndex ? `${urlPath}index.html` : `${urlPath}.html`;
  const relative = absolute.replace(/^\//, "");
  const parsedPath = path.posix.parse(relative);
  const filePath = path.format(parsedPath);
  if (base) {
    return path.join(base, filePath);
  } else {
    return filePath;
  }
};

const getRouteByPath = (urlPath: string) => {
  return routes.find((route) => {
    if (route.path instanceof RegExp) {
      return urlPath.match(route.path);
    } else if (typeof route.path === "string") {
      return urlPath === route.path;
    } else {
      return false;
    }
  });
};

const constantRoutes = ["/"];
const getPostRoutes = async () => {
  const posts = await fs.readdir(paths.posts);
  return posts.map((post) => `/post/${post}`);
};
const getPostList = async () => {
  const posts = await fs.readdir(paths.posts);
  return posts.map((post) => `/post/${post}`);
};

const paths = {
  dist: path.join(process.cwd(), "dist"),
  public: path.join(process.cwd(), "public"),
  posts: path.join(process.cwd(), "posts"),
};

(async () => {
  const generatedRoutes = [...constantRoutes, ...(await getPostRoutes())];

  for (const urlPath of generatedRoutes) {
    const route = getRouteByPath(urlPath);
    if (!route) {
      continue;
    }
    try {
      const element = await matchRoute(
        urlPath,
        { path: "/", render: () => <Index /> },
        {
          path: /\/post\//,
          render: async () => {
            const html = `<p>${1}</p>`;
            return (
              <PostPage post={{ metadata: { title: "test title" }, html }} />
            );
          },
        }
      );
      const html = renderToStaticMarkup(element);
      console.log(`🟢${urlPath}\n${html}\n`);
      const filePath = urlPathToFilePath(urlPath, paths.dist);
      const fileDir = path.dirname(filePath);
      await fs.mkdir(fileDir, { mode: 0o755, recursive: true });
      await fs.writeFile(filePath, html);
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
      } else {
        throw err;
      }
    }
  }
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
})();
