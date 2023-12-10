import { FC } from "react";
import Head from "../components/head";

const Page404: FC = () => {
  return (
    <html lang="zh">
      <Head />
      <body>
        <div className="text-center pt-8">
          <h1 className="text-4xl text-gray-300 mb-4">404</h1>
          <p className="text-lg text-gray-400">Nothing here.</p>
        </div>
      </body>
    </html>
  );
};

export default Page404;
