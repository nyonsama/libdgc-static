import { FunctionComponent, ReactElement, ReactNode } from "react";
import { Index } from "./pages";
import { PostPage } from "./pages/post";

// check type
const createRoute = (path: string | RegExp, component: () => ReactElement) => ({
  path,
  component,
});

export const routes = [
  createRoute("/", () => <Index />),
  createRoute("/post/asdf", () => (
    <PostPage
      {...{
        post: {
          metadata: { title: "test post title" },
          html: "<p>some post content</p>",
        },
      }}
    />
  )),
] as const;
