import { FC } from "react";
import { Post } from "../types";
import Head from "../components/Head";
import IconToc from "../components/IconToc";
import Footer from "../components/Footer";
import Link from "../components/Link";
import Script from "../components/Script";
import IconCalendar from "../components/IconCalendar";

// TODO: 点击图片放大

const clientCode = () => {
  let showSidebar = false;
  const $ = document.querySelector.bind(document);
  const sidebar = $("#sidebar") as HTMLDivElement;
  const backdrop = $("#backdrop") as HTMLDivElement;
  const tocButton = $("#button-show-toc") as HTMLDivElement;
  const toggleSidebar = () => {
    showSidebar = !showSidebar;
    if (showSidebar) {
      sidebar.classList.remove("max-lg:translate-x-full");
      backdrop.classList.remove("-z-50", "opacity-0");
      backdrop.classList.add("z-10", "opacity-50");
    } else {
      sidebar.classList.add("max-lg:translate-x-full");
      backdrop.classList.remove("z-10", "opacity-50");
      backdrop.classList.add("-z-50", "opacity-0");
    }
  };
  tocButton.onclick = toggleSidebar;
  backdrop.onclick = toggleSidebar;
};
export interface PostPageProps {
  post: Post;
}
export const PostPage: FC<PostPageProps> = ({ post }: PostPageProps) => {
  return (
    <html lang="zh">
      <Head title={post.metadata.title}>
        <link href="/github-dark.min.css" rel="stylesheet" />
      </Head>
      <body>
        <div className="flex min-h-full flex-col">
          {/* navbar */}
          <nav className="sticky top-0 flex justify-center bg-black">
            <div className="mx-4 flex h-12 flex-1 flex-row items-center justify-between sm:max-w-2xl lg:max-w-4xl">
              <a href="/">libdgc</a>
              <IconToc id="button-show-toc" className="h-6 w-6 lg:hidden" />
            </div>
          </nav>
          <div className="flex flex-1 flex-col items-center px-4 py-8">
            <div className="flex w-full flex-row-reverse justify-between sm:max-w-2xl lg:max-w-4xl">
              {/* sidebar */}
              <aside
                id="sidebar"
                className="w-48 transition-transform max-lg:fixed max-lg:bottom-0 max-lg:right-0 max-lg:top-0 max-lg:z-20 max-lg:w-56 max-lg:translate-x-full max-lg:bg-zinc-900 max-lg:p-4 lg:ml-8"
              >
                <div className="overflow-y-auto lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem-6rem)]">
                  <h2 className="mb-2 text-lg font-medium">目录</h2>
                  <hr className="mb-2 border-t border-solid border-gray-600" />
                  <ul>
                    {post.metadata.toc?.map((toc) => (
                      <li
                        key={toc.id}
                        style={{ marginLeft: `${(toc.level - 2) * 0.5}rem` }}
                        className="mb-2"
                      >
                        <a
                          className={`text-sm text-gray-400 underline-offset-2 hover:underline`}
                          href={"#" + encodeURIComponent(toc.id)}
                        >
                          {toc.content}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
              {/* post body */}
              <main className="prose prose-invert max-w-full flex-1 prose-headings:text-gray-300 prose-a:text-[#74b0e4] prose-a:no-underline prose-a:underline-offset-2">
                {/* title */}
                <h1>{post.metadata.title}</h1>
                <div className="not-prose flex">
                  <div className="mr-4">
                    <IconCalendar className="mr-2 inline-block h-full w-[18px] align-top" />
                    {post.metadata.createDate}
                  </div>
                  {/* tags */}
                  <div className="not-prose flex gap-2 text-gray-400">
                    {post.metadata.tags?.map((tag, i) => (
                      <div key={i}>#{tag}</div>
                    ))}
                  </div>
                </div>
                {/* content */}
                <div
                  className="post"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                ></div>
              </main>
            </div>
          </div>
          <Footer className="sm:max-w-2xl lg:max-w-4xl" />
          <div
            id="backdrop"
            className="fixed inset-0 -z-50 bg-black opacity-0 transition-opacity lg:hidden"
          ></div>
        </div>
        <Script content={`(${clientCode})()`} />
        <Script
          type="speculationrules"
          content={JSON.stringify({
            prefetch: [
              {
                source: "list",
                urls: ["/index.html"],
              },
            ],
          })}
        />
      </body>
    </html>
  );
};
