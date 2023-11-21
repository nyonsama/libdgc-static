import { FC } from "react";
import Head from "../components/head";

const Page404: FC = () => {
  return (
    <html lang="zh">
      <Head />
      <body>
        <div>
          <h1>404</h1>
          <p>This page seems does not exists.</p>
        </div>
      </body>
    </html>
  );
};

export default Page404;
