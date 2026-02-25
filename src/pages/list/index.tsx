import Head from "../../components/Head";
import PostList from "../../components/PostList";
import Footer from "../../components/Footer";
import OldBrowserWarning from "../../components/OldBrowserWarning";

const ListPage = async ({ path }: { path: string }) => {
  const currentPage = Number(path.match(/\/list\/([0-9]+)/)![1]);
  return (
    <html lang="zh">
      <Head title={`文章列表 - 第 ${currentPage} 页`}>
        <script async src="/src/pages/list/client.ts" type="module"></script>
      </Head>
      <body>
        <div className="flex min-h-screen flex-col">
          <nav className="sticky top-0 flex justify-center bg-black">
            <div className="mx-4 flex h-12 max-w-2xl flex-1 flex-row items-center justify-between">
              <a href="/">libdgc</a>
            </div>
          </nav>
          <div className="flex flex-1 flex-col items-center px-4 pb-8">
            <div className="w-full max-w-2xl pt-6">
              <h1 className="text-2xl">文章列表</h1>
              {await PostList({ currentPage: currentPage })}
            </div>
          </div>
          <Footer className="max-w-2xl" />
        </div>
        <OldBrowserWarning />
      </body>
    </html>
  );
};

export default ListPage;
