import { FC } from "react";
import { Post } from "../types";
import Head from "../components/head";
import IconToc from "../components/IconToc";
import Footer from "../components/Footer";

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
      <Head />
      <body>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 flex justify-center bg-black text-gray-300">
            <div className="mx-4 flex h-12 flex-1 flex-row items-center justify-between sm:max-w-2xl lg:max-w-4xl">
              <a href="/">libdgc</a>
              <IconToc id="button-show-toc" className="h-6 w-6 lg:hidden" />
            </div>
          </header>
          <div className="flex flex-1 flex-col items-center p-4">
            <div className="flex w-full flex-row-reverse justify-between sm:max-w-2xl lg:max-w-4xl">
              <div
                id="sidebar"
                className="w-48 transition-transform max-lg:fixed max-lg:bottom-0 max-lg:right-0 max-lg:top-0 max-lg:z-20 max-lg:w-56 max-lg:translate-x-full max-lg:bg-zinc-900 max-lg:p-4 lg:ml-8"
              >
                <div className="overflow-y-auto lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem-6rem)]">
                  <h2 className="mb-2 text-lg font-medium text-gray-300">
                    目录
                  </h2>
                  <hr className="border-t border-solid border-gray-600" />
                  <ul>
                    {post.metadata.toc?.map((toc) => (
                      <li
                        key={toc.id}
                        style={{ marginLeft: `${(toc.level - 2) * 0.5}rem` }}
                        className="mb-2"
                      >
                        <a
                          className={`text-sm text-gray-400 hover:underline`}
                          href={"#" + encodeURIComponent(toc.id)}
                        >
                          {toc.content}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="prose prose-invert max-w-full flex-1 prose-headings:text-gray-300 prose-a:text-[#74b0e4] prose-a:no-underline prose-a:underline-offset-2">
                <h1>{post.metadata.title}</h1>
                <div className="not-prose flex gap-2">
                  {post.metadata.tags?.map((tag, i) => (
                    <div className="text-[#ddb26c]" key={i}>
                      #{tag}
                    </div>
                  ))}
                </div>
                <div
                  className="post"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                ></div>
              </div>
            </div>
          </div>
          <Footer />
          <div
            id="backdrop"
            className="fixed inset-0 -z-50 bg-black opacity-0 transition-opacity lg:hidden"
          ></div>
        </div>
        <script
          dangerouslySetInnerHTML={{ __html: `(${clientCode})()` }}
        ></script>
      </body>
    </html>
  );
};
