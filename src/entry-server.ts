import { renderToStaticMarkup } from "react-dom/server";
// import Page404 from "./pages/404";
import { IndexPage } from "./pages/index";
// import ListPage from "./pages/list";
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

export const getPage = async (path: string) => {
  switch (path) {
    case "":
    case "/":
      return await IndexPage();
    // case "/404":
    //   return await Page404();
    // case "/list":
    //   return await ListPage();

    default:
      break;
  }
  // if (/^\/post\/.+/.test(path)) {
  //   return await PostPage({ path });
  // }
};

export const render = async (url: string) => {
  // await Promise.all(tasks);
  // tasks.length = 0;
  const node = await getPage(url);
  const html = renderToStaticMarkup(node);
  return { html };
};
