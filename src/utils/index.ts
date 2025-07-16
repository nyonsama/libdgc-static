import path from "node:path";
import fs from "node:fs/promises";
import { renderMarkdown } from "./renderMarkdown";
import { generateAbstractFromHtml } from "./generateAbstract";
import { Post } from "../types";

export * from "./renderMarkdown";
export * from "./generateAbstract";
export * from "./compressPunctuation";

export const postsPerPage = 10;
export const getPostNames = async () => {
  return await fs.readdir("posts");
};
export const getPostPageCount = async () => {
  const postNames = await getPostNames();
  return Math.ceil(postNames.length / postsPerPage);
};

export const getAllPosts = async () => {
  const postNames = await getPostNames();
  const allPosts = await Promise.all(
    postNames.map((postName) => renderPost(postName)),
  );
  return allPosts.sort(
    (a, b) =>
      new Date(b.metadata.createDate).valueOf() -
      new Date(a.metadata.createDate).valueOf(),
  );
};

export const renderPost = async (postName: string): Promise<Post> => {
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
