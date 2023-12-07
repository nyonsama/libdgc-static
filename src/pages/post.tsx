import { FC } from "react";
import { Post } from "../types";
import Head from "../components/head";
import classNames from "classnames";

export interface PostPageProps {
  post: Post;
}
export const PostPage: FC<PostPageProps> = ({ post }: PostPageProps) => {
  return (
    <html lang="zh">
      <Head />
      <body>
        <div className="bg-zinc-900 flex flex-col min-h-screen">
          <header className="bg-black flex justify-center sticky top-0">
            <div className="sm:max-w-2xl lg:max-w-4xl mx-4 h-12 flex-1 flex flex-row justify-between items-center">
              <div>libdgc</div>
              <div id="button-show-toc">toc</div>
            </div>
          </header>
          <div className="flex-1 flex flex-col items-center p-4">
            <div className="sm:max-w-2xl lg:max-w-4xl w-full flex flex-row-reverse justify-between">
              <div
                id="sidebar"
                className="w-48 lg:ml-8 max-lg:p-4 max-lg:fixed max-lg:right-0 max-lg:top-0 max-lg:bottom-0 max-lg:bg-zinc-900 max-lg:z-20 max-lg:translate-x-full transition-transform"
              >
                <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem-6rem)] overflow-y-auto">
                  <h2 className="mb-2 text-lg text-gray-300 font-medium">
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
              <div
                className={classNames(
                  "prose prose-invert max-w-full",
                  "prose-headings:text-gray-300 prose-a:text-[#74b0e4] prose-a:no-underline prose-a:underline-offset-2",
                  "flex-1"
                )}
              >
                <h1>{post.metadata.title}</h1>
                <div className="not-prose flex gap-2">
                  {post.metadata.tags?.map((tag) => (
                    <div className="text-[#74b0e4]">#{tag}</div>
                  ))}
                </div>
                <div
                  className="post"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                ></div>
              </div>
            </div>
          </div>
          <footer className="bg-black flex justify-center">
            <div className="sm:max-w-2xl lg:max-w-4xl mx-4 h-12 flex-1 flex flex-row justify-between items-center">
              <div>libdgc</div>
              <div>icon</div>
            </div>
          </footer>
          <div
            id="backdrop"
            className="-z-50 bg-black opacity-0 fixed inset-0 transition-opacity"
          ></div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
let showSidebar = false;
const $ = document.querySelector.bind(document);
const sidebar = $('#sidebar');
const backdrop = $('#backdrop');
const tocButton = $('#button-show-toc')
const toggleSidebar = () => {
  showSidebar = !showSidebar;
  if (showSidebar) {
    sidebar.classList.remove('max-lg:translate-x-full');
    backdrop.classList.remove('-z-50', 'opacity-0')
    backdrop.classList.add('z-10', 'opacity-50')
  } else {
    sidebar.classList.add('max-lg:translate-x-full');
    backdrop.classList.remove('z-10', 'opacity-50')
    backdrop.classList.add('-z-50', 'opacity-0')
  }
}
tocButton.onclick = toggleSidebar
backdrop.onclick = toggleSidebar
        `,
          }}
        ></script>
      </body>
    </html>
  );
};
