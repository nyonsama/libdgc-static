import Head from "../../components/Head";
import { Post } from "../../types";
import Footer from "../../components/Footer";
import PostList, { Pagination } from "../../components/PostList";
import OldBrowserWarning from "../../components/OldBrowserWarning";
import GoogleAnalytics from "../../components/GoogleAnalytics";
import path from "node:path";
import fs from "node:fs/promises";
import { generateAbstractFromHtml, renderMarkdown } from "../../utils";

export interface IndexProps {
  posts: Post[];
  pagination: Pagination;
}
const renderPost = async (postName: string) => {
  const postPath = path.join("posts", postName);
  const filePath = path.join(postPath, "index.md");
  const mdString = (await fs.readFile(filePath)).toString("utf8");
  const { frontMatter, toc, html } = await renderMarkdown(mdString, postPath);
  if (!frontMatter.title) {
    throw new Error(`${postPath} title is empty`);
  }
  if (!frontMatter.createDate) {
    throw new Error(`${postPath} createDate is empty`);
  }
  const abstract = await generateAbstractFromHtml(html);
  return {
    metadata: {
      toc,
      ...frontMatter,
    },
    html,
    abstract,
    path: `/posts/${postName}/`,
  };
};

const postsPerPage = 10;

export const IndexPage = async () => {
  const postNames = await fs.readdir("posts");
  const totalPages = Math.ceil(postNames.length / postsPerPage);
  const pagination = { current: 0, total: totalPages };
  const allPosts = await Promise.all(
    postNames.map((postName) => renderPost(postName)),
  );
  const posts = allPosts
    .toSorted(
      (a, b) =>
        new Date(b.metadata.createDate).valueOf() -
        new Date(a.metadata.createDate).valueOf(),
    )
    .slice(0, postsPerPage);

  return (
    <html lang="zh">
      <Head>
        <script
          async
          src="/src/pages/index/index.client.ts"
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
