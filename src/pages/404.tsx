import { FC } from "react";
import Head from "../components/Head";
import Link from "../components/Link";

const Page404: FC = () => {
  return (
    <html lang="zh">
      <Head title="404" />
      <body>
        <div className="pt-8 text-center">
          <h1 className="mb-4 text-4xl">404</h1>
          <p className="text-lg text-gray-400">
            Nothing here.
            <br />
            <Link href="/">Home</Link>
          </p>
        </div>
      </body>
    </html>
  );
};

export default Page404;
