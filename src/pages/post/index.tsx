import Head from "../../components/Head";
import IconToc from "../../components/IconToc";
import Footer from "../../components/Footer";
import Script from "../../components/Script";
import IconCalendar from "../../components/IconCalendar";
import OldBrowserWarning from "../../components/OldBrowserWarning";
import { renderPost } from "../../utils";
import { Sidebar } from "./sidebar";

export interface PostPageProps {
  postName: string;
}
export const PostPage = async ({ postName }: PostPageProps) => {
  const post = await renderPost(postName);
  return (
    <html lang="zh">
      <Head title={`${post.metadata.title} - libdgc.club`}>
        <script async src="/src/pages/post/client.ts" type="module"></script>
      </Head>
      <body>
        <div className="flex min-h-screen flex-col">
          {/* navbar */}
          <nav
            id="navbar"
            data-show
            className="sticky top-0 z-30 flex -translate-y-full justify-center bg-black transition-transform data-show:translate-y-0"
          >
            <div className="mx-4 flex h-12 flex-1 flex-row items-center justify-between sm:max-w-2xl lg:max-w-4xl">
              <a href="/">libdgc</a>
              <button
                id="button-show-toc"
                className="-mr-4 flex h-12 w-12 cursor-pointer items-center justify-center active:bg-zinc-800 lg:hidden"
              >
                <IconToc className="h-6 w-6" />
              </button>
            </div>
          </nav>
          <div className="flex flex-1 flex-col items-center px-4 py-8">
            <div className="flex w-full flex-row-reverse justify-between sm:max-w-2xl lg:max-w-4xl">
              {/* sidebar */}
              <Sidebar toc={post.metadata.toc} />
              {/* post body */}
              <main className="prose prose-invert prose-zinc prose-headings:text-zinc-300 prose-a:text-[#74b0e4] prose-a:no-underline prose-a:underline-offset-2 min-w-0 flex-1">
                <article>
                  {/* title */}
                  <h1>
                    <span>{post.metadata.title}</span>
                  </h1>
                  <div className="not-prose flex flex-wrap">
                    <div className="mr-4">
                      <IconCalendar className="mr-2 inline-block h-full w-4.5 align-top" />
                      {post.metadata.createDate}
                    </div>
                    {/* tags */}
                    <div className="not-prose flex flex-wrap gap-2 text-zinc-400">
                      {post.metadata.tags?.map((tag, i) => (
                        <div key={i}>#{tag}</div>
                      ))}
                    </div>
                  </div>
                  {post.metadata.lastEditDate && (
                    <div className="not-prose mt-2 text-sm text-zinc-400">
                      最近编辑：{post.metadata.lastEditDate}
                    </div>
                  )}
                  {/* content */}
                  <div
                    className="post"
                    dangerouslySetInnerHTML={{ __html: post.html }}
                  ></div>
                </article>
              </main>
            </div>
          </div>
          <Footer className="sm:max-w-2xl lg:max-w-4xl" />
          <div
            id="backdrop"
            className="pointer-events-none fixed inset-0 bg-black opacity-0 transition-opacity data-show:pointer-events-auto data-show:z-10 data-show:opacity-50"
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
