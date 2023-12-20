import { FC, Fragment } from "react";
import { Post } from "../types";
import classNames from "classnames";
import IconCalendar from "./IconCalendar";

export interface Pagination {
  current: number;
  total: number;
}
export interface PostListProps {
  posts: Post[];
  pagination: Pagination;
}
const PostList: FC<PostListProps> = ({ posts, pagination }) => {
  return (
    <div className="flex flex-col pt-4">
      <hr className="border-zinc-700" />
      {posts.map(({ metadata, path, html, abstract }, index) => (
        <Fragment key={index}>
          <article className="mb-4 mt-4 flex flex-col">
            <h3 className="mb-2">
              <a
                className="text-xl text-[#74b0e4] underline-offset-2 hover:underline"
                href={path}
              >
                {metadata.title}
              </a>
            </h3>

            <div className="mb-2 line-clamp-3 text-sm text-gray-400">
              {abstract.slice(0, 200)}
            </div>

            <div className="flex justify-between text-sm">
              <div className="flex gap-2 text-gray-300">
                {metadata.tags?.map((tag, i) => <div key={i}>#{tag}</div>)}
              </div>
              <div>{metadata.createDate}</div>
            </div>
          </article>
          <hr className="border-zinc-700" />
        </Fragment>
      ))}
      <div className="flex justify-end pt-2">
        {Array(pagination.total)
          .fill(null)
          .map((_, i) => (
            <a
              key={i}
              href={`/list/${i + 1}.html`}
              className={classNames(
                "flex h-8 w-8 items-center justify-center text-sm",
                i === pagination.current
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
