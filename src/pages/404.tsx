import Head from "../components/Head";
import Link from "../components/Link";
import GoogleAnalytics from "../components/GoogleAnalytics";

const Page404 = () => {
  return (
    <html lang="zh">
      <Head title="404" />
      <body>
        <div className="pt-8 text-center">
          <h1 className="mb-4 text-4xl">404</h1>
          <p className="text-lg text-zinc-400">
            Nothing here.
            <br />
            <Link href="/">Home</Link>
          </p>
        </div>
        <GoogleAnalytics />
      </body>
    </html>
  );
};

export default Page404;
