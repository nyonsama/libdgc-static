import { Fragment } from "react";
import classNames from "classnames";
import CompressPunctuation from "./CompressPunctuation";
import { getAllPosts, postsPerPage } from "../utils";

export interface PostListProps {
  currentPage: number; // 从1开始
}
const PostList = async ({ currentPage }: PostListProps) => {
  const posts = await getAllPosts();
  const currentPostIndex = (currentPage - 1) * postsPerPage;
  const currentPagePosts = posts.slice(
    currentPostIndex,
    currentPostIndex + postsPerPage,
  );
  const totalPages = Math.ceil(posts.length / postsPerPage);
  return (
    <div className="flex flex-col pt-4">
      <hr className="border-zinc-700" />
      {currentPagePosts.map(({ metadata, path, abstract }, index) => (
        <Fragment key={index}>
          <article className="mb-4 mt-4 flex flex-col">
            <h2 className="mb-2">
              <a
                className="text-xl text-[#74b0e4] underline-offset-2 hover:underline"
                href={path}
              >
                {metadata.title}
              </a>
            </h2>

            <div className="mb-2 line-clamp-3 text-sm text-zinc-400">
              <CompressPunctuation text={abstract.slice(0, 250)} />
            </div>

            <div className="flex justify-between text-sm">
              <div className="flex gap-2 text-zinc-300">
                {metadata.tags?.map((tag, i) => (
                  <div key={i}>#{tag}</div>
                ))}
              </div>
              <div>{metadata.createDate}</div>
            </div>
          </article>
          <hr className="border-zinc-700" />
        </Fragment>
      ))}
      <div className="flex justify-end pt-2">
        {Array(totalPages)
          .fill(null)
          .map((_, i) => (
            <a
              key={i}
              href={`/list/${i + 1}.html`}
              className={classNames(
                "flex h-8 w-8 items-center justify-center text-sm",
                i + 1 === currentPage
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "hover:bg-zinc-800",
              )}
            >
              {i + 1}
            </a>
          ))}
      </div>
    </div>
  );
};

export default PostList;
