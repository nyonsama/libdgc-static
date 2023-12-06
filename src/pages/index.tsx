import { FC } from "react";
import Head from "../components/head";

export const Index: FC<{}> = () => {
  return (
    <html lang="zh">
      <Head />
      <body>
        <div>
          <h2>home</h2>
          <a href="/posts/rendertest">posts/rendertest</a>
        </div>
      </body>
    </html>
  );
};
