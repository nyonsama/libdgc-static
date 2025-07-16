import { renderToStaticMarkup } from "react-dom/server";
import Page404 from "./pages/404";
import { IndexPage } from "./pages/index";
import ListPage from "./pages/list";
import { getPostNames, getPostPageCount } from "./utils";
import { JSX } from "react/jsx-runtime";
import { PostPage } from "./pages/post";
// import { PostPage } from "./pages/post";

// const tasks: Promise<void>[] = [];

// export const useBeforeRender = (callback: () => void | Promise<void>) => {
//   const result = callback();
//   if (result instanceof Promise) {
//     tasks.push(result);
//   }
// };

// export const onBeforeRender = async () => {
//   await Promise.all(tasks);
//   tasks.length = 0;
// };

// const routes = {
//   component: IndexPage,
// };

// const getAllRoutes = async () => {
//   return;
// };

interface Route {
  path: string | RegExp | Array<string | RegExp>;
  component: (path: string) => JSX.Element | Promise<JSX.Element>;
  staticRoutes: () => string[] | Promise<string[]>;
}

const routes: Route[] = [
  {
    path: ["", "/"],
    component: () => IndexPage(),
    staticRoutes: () => ["/index.html"],
  },
  {
    path: "/404",
    component: () => Page404(),
    staticRoutes: () => ["/404.html"],
  },
  {
    path: /\/list\/[0-9]+/,
    component: (path) =>
      ListPage({ currentPage: Number(path.match(/\/list\/([0-9]+)/)![1]) }),
    staticRoutes: async () =>
      Array(await getPostPageCount())
        .fill(null)
        .map((_, index) => `/list/${index + 1}.html`),
  },
  {
    path: /\/posts\/[^\/]+$/,
    component: (path) =>
      PostPage({ postName: path.match(/\/posts\/(.+)/)![1] }),
    staticRoutes: async () => {
      return (await getPostNames()).map(
        (postName) => `/posts/${postName}/index.html`,
      );
    },
  },
];
export const getStaticRoutes = async () => {
  const result: string[] = [];
  for (const route of routes) {
    result.push(...(await route.staticRoutes()));
  }
  return result;
};

export const getRoute = (path: string) => {
  for (const route of routes) {
    const patterns = Array.isArray(route.path) ? route.path : [route.path];
    for (const pattern of patterns) {
      if (pattern instanceof RegExp) {
        if (pattern.test(path)) {
          return route;
        }
      } else if (pattern === path) {
        return route;
      }
    }
  }
};

// export const getPage = async (path: string) => {
//   const trimmed = path
//     .replace(/^\//, "")
//     .replace(/\/$/, "")
//     .replace(/\.html$/, "");
//   switch (trimmed) {
//     case "":
//     case "/":
//       return await IndexPage();
//     case "/404":
//       return await Page404();
//     // case "/list":
//     //   return await ListPage();

//     default:
//       break;
//   }
//   if (/^\/?list\/[0-9]+/.test(trimmed)) {
//     const pageNumber = Number(trimmed.split("/")[1]);
//     return await ListPage({ pageNumber });
//   }
//   // if (/^\/post\/.+/.test(path)) {
//   //   return await PostPage({ path });
//   // }
// };

export const render = async (url: string) => {
  // await Promise.all(tasks);
  // tasks.length = 0;
  // const node = await getPage(url);
  const node = await getRoute(url)!.component(url);
  const html = "<!DOCTYPE html>" + renderToStaticMarkup(node);
  return { html };
};
