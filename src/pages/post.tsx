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
          <header className="bg-black flex justify-center">
            <div className="sm:max-w-2xl lg:max-w-4xl mx-4 h-12 flex-1 flex flex-row justify-between items-center">
              <div>libdgc</div>
              <div>home</div>
            </div>
          </header>
          <div className="flex-1 flex flex-col items-center p-4">
            {/* <div className="max-w-full sm:w-[42rem] lg:w-[56rem] flex justify-between"> */}
            <div className="sm:max-w-2xl lg:max-w-4xl w-full flex justify-between">
              <div
                className={classNames(
                  "prose prose-invert max-w-full",
                  "prose-headings:text-gray-300 prose-a:text-[#74b0e4] prose-a:no-underline prose-a:underline-offset-2",
                  "flex-1"
                )}
              >
                <h1>{post.metadata.title}</h1>
                {/* <p>{JSON.stringify(post.metadata)}</p> */}
                <div className="not-prose">
                  <h2>not prose</h2>
                </div>
                <div
                  className="post"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                ></div>
              </div>
              <div className="max-lg:hidden ml-8">
                <div className="sticky top-24 max-h-[calc(100vh-6rem-6rem)] w-48 overflow-y-auto">
                  <h2 className="mb-2 text-lg text-gray-300 font-medium">
                    目录
                  </h2>
                  <hr className="border-t border-solid border-gray-600" />
                  <ul>
                    {post.metadata.toc?.map((toc) => {
                      return (
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
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <footer className="bg-black flex justify-center">
            <div className="sm:max-w-2xl lg:max-w-4xl mx-4 h-12 flex-1 flex flex-row justify-between items-center">
              <div>libdgc</div>
              <div>icon</div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
};
