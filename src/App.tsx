import { ReactElement } from "react";
import { Index } from "./pages";
import { PostPage } from "./pages/post";
import { routes } from "./routes";

// const routesFunc = (param: Object): [string | RegExp, ReactElement][] => [
//   ["/", <Index />],
//   [/^\/post/, <PostPage param={param} />],
// ];

const getRoute = (path: string) => {
  return routes.find((route) => {
    if (route.path instanceof RegExp) {
      return path.match(route.path);
    } else if (typeof route.path === "string") {
      return path === route.path;
    } else {
      return false;
    }
  });
};

export const App = (props: { path: string }) => {
  const { path } = props;
  const route = getRoute(path);
  if (!route) {
    throw new Error("404");
  }
  const component = route.component();
  return (
    <html lang="zh">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="/style.css" rel="stylesheet" />
        <title>libdgc-static</title>
      </head>
      <body>
        <div>
          <h1 className="border border-green-300 rounded">title</h1>
          {component}
        </div>
      </body>
    </html>
  );
};
