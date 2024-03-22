import { FC } from "react";
import { Post } from "../types";
import Head from "../components/Head";
import IconToc from "../components/IconToc";
import Footer from "../components/Footer";
import Link from "../components/Link";
import Script from "../components/Script";
import IconCalendar from "../components/IconCalendar";
import OldBrowserWarning from "../components/OldBrowserWarning";

export interface PostPageProps {
  post: Post;
}
export const PostPage: FC<PostPageProps> = ({ post }: PostPageProps) => {
  return (
    <html lang="zh">
      <Head title={`${post.metadata.title} - libdgc.club`}></Head>
      <body>
        <div className="flex min-h-full flex-col ">
          {/* navbar */}
          <nav
            id="navbar"
            className="sticky top-0 z-30 flex justify-center bg-black transition-transform"
          >
            <div className="mx-4 flex h-12 flex-1 flex-row items-center justify-between sm:max-w-2xl lg:max-w-4xl">
              <a href="/">libdgc</a>
              <div
                id="button-show-toc"
                className="-mr-4 flex h-12 w-12 cursor-pointer items-center justify-center lg:hidden"
              >
                <IconToc className="h-6 w-6" />
              </div>
            </div>
          </nav>
          <div className="flex flex-1 flex-col items-center px-4 py-8">
            <div className="flex w-full flex-row-reverse justify-between sm:max-w-2xl lg:max-w-4xl">
              {/* sidebar */}
              <aside
                id="sidebar"
                className="w-48 transition-transform max-lg:fixed max-lg:-right-56 max-lg:bottom-0 max-lg:top-0 max-lg:z-40 max-lg:w-56 max-lg:bg-zinc-900 lg:ml-8"
              >
                <div className="h-full overflow-y-auto max-lg:px-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)]">
                  <h2 className="text-lg font-medium leading-[3rem]">目录</h2>
                  <hr className="mb-2 border-t border-solid border-gray-600" />
                  <ul className="mb-8">
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
              <main className="prose prose-invert prose-headings:text-gray-300 prose-a:text-[#74b0e4] prose-a:no-underline prose-a:underline-offset-2 max-w-full flex-1">
                {/* title */}
                <h1>{post.metadata.title}</h1>
                <div className="not-prose flex flex-wrap">
                  <div className="mr-4">
                    <IconCalendar className="mr-2 inline-block h-full w-[18px] align-top" />
                    {post.metadata.createDate}
                  </div>
                  {/* tags */}
                  <div className="not-prose flex flex-wrap gap-2 text-gray-400">
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
            className="pointer-events-none fixed inset-0 bg-black opacity-0 transition-opacity"
          ></div>
        </div>
        <OldBrowserWarning />
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
