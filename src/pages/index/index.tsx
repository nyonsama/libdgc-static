import Head from "../../components/Head";
import Footer from "../../components/Footer";
import PostList from "../../components/PostList";
import OldBrowserWarning from "../../components/OldBrowserWarning";
import GoogleAnalytics from "../../components/GoogleAnalytics";

export const IndexPage = async () => {
  return (
    <html lang="zh">
      <Head>
        <script
          async
          src="/src/pages/index/client.ts"
          type="module"
        ></script>
      </Head>
      <body>
        <div className="flex min-h-screen flex-col">
          <nav className="sticky top-0 flex justify-center bg-black">
            <div className="mx-4 flex h-12 max-w-2xl flex-1 flex-row items-center justify-between">
              <a href="/">libdgc</a>
            </div>
          </nav>
          <div className="flex flex-1 flex-col items-center px-4 pb-8">
            <div className="w-full max-w-2xl">
              <header className="my-16 text-center">
                <h1 className="mb-2 text-4xl">libdgc.club</h1>
                <p className="font-light text-zinc-400">电子草稿纸</p>
              </header>
              {/* <h2 className="text-2xl">文章列表</h2> */}
              {await PostList({ currentPage: 1 })}
            </div>
          </div>
          <Footer className="max-w-2xl" />
        </div>
        <OldBrowserWarning />
        <GoogleAnalytics />
      </body>
    </html>
  );
};
