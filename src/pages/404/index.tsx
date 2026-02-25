import Head from "../../components/Head";
import Link from "../../components/Link";

const Page404 = () => {
  return (
    <html lang="zh">
      <Head title="404">
        <script async src="/src/pages/404/client.ts" type="module"></script>
      </Head>
      <body>
        <div className="pt-8 text-center">
          <h1 className="mb-4 text-4xl">404</h1>
          <p className="text-lg text-zinc-400">
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
