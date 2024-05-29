import { FC } from "react";
import Head from "../components/Head";
import PostList, { Pagination } from "../components/PostList";
import { Post } from "../types";
import Footer from "../components/Footer";
import OldBrowserWarning from "../components/OldBrowserWarning";
import GoogleAnalytics from "../components/GoogleAnalytics";

export interface ListPageProps {
  posts: Post[];
  pagination: Pagination;
}
const ListPage: FC<ListPageProps> = ({ pagination, posts }) => {
  return (
    <html lang="zh">
      <Head title={`文章列表-第${pagination.current + 1}页`} />
      <body>
        <div className="flex min-h-screen flex-col">
          <nav className="sticky top-0 flex justify-center bg-black">
            <div className="mx-4 flex h-12 max-w-2xl flex-1 flex-row items-center justify-between">
              <a href="/">libdgc</a>
            </div>
          </nav>
          <div className="flex flex-1 flex-col items-center px-4 pb-8">
            <div className="w-full max-w-2xl pt-4">
              <h1 className="text-2xl">文章列表</h1>
              <PostList posts={posts} pagination={pagination} />
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

export default ListPage;
