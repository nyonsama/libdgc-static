import { FC } from "react";
import { Post } from "../types";

export interface PostPageProps {
  post: Post;
}
export const PostPage: FC<PostPageProps> = ({ post }: PostPageProps) => {
  return (
    <div>
      <h1>Post</h1>
      <p>{JSON.stringify(post.metadata)}</p>
      <div dangerouslySetInnerHTML={{ __html: post.html }}></div>
    </div>
  );
};
