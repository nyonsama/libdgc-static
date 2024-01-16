import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import type hast from "hast";
import type mdast from "mdast";
import type { VFile } from "vfile";
import { visit } from "unist-util-visit";
import { toHtml } from "hast-util-to-html";
import { matter } from "vfile-matter";
import rehypePresetMinify from "rehype-preset-minify";
import { h } from "hastscript";
import { TocEntry } from "../types";
import {
  allCompressibleCharacters,
  rehypeCompressPunctuation,
} from "./compressPunctuation";

const remarkRemoveTitle = () => (tree: mdast.Root, file: VFile) => {
  let titleIndex = tree.children.findIndex(
    (c) => c.type === "heading" && c.depth === 1,
  );
  if (titleIndex !== -1) {
    tree.children.splice(titleIndex, 1);
  }
};

const rehypeExtractToc = () => (tree: hast.Root, file: VFile) => {
  const toc: TocEntry[] = [];
  visit(tree, "element", (node) => {
    if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.tagName)) {
      toc.push({
        id: String(node.properties?.id),
        level: parseInt(node.tagName[1]) as TocEntry["level"],
        content: toHtml(node.children),
      });
    }
  });
  file.data.toc = toc;
};

const getLastTextNode = (node: hast.Element): hast.Text | null => {
  const lastChild = node.children
    .filter((child) => child.type === "element" || child.type === "text")
    .at(-1);
  if (!lastChild) {
    return null;
  } else if (lastChild.type === "text") {
    return lastChild;
  } else if (lastChild.type === "element") {
    return getLastTextNode(lastChild);
  } else {
    throw new Error("impossible");
  }
};

const rehypeExternalAnchor = () => (tree: hast.Root, file: VFile) => {
  visit(tree, "element", (node) => {
    if (node.tagName === "a") {
      const href = String(node.properties.href);
      const target = node.properties.target;
      if (href.match(/^[0-9a-zA-Z\-+._]+:/) || target === "_blank") {
        node.properties.target = "_blank";
        const lastText = getLastTextNode(node);
        // 挤压图标前面的全角标点
        // 可能覆盖不了所有情况
        const needCompress = new RegExp(`[${allCompressibleCharacters}]$`).test(
          lastText?.value ?? "",
        );
        const icon = h("img", {
          class: [
            "inline-block",
            "w-3",
            "h-3",
            needCompress ? "ml-0" : "ml-1",
            "align-baseline",
            "not-prose",
          ],
          src: "/assets/img/external-link.svg",
        });
        node.children.push(icon);
        node.children.push({ type: "text", value: " " });
      }
    }
  });
};

export const renderMarkdown = async (markdown: string) => {
  const vf = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter, { type: "yaml", marker: "-" })
    .use(() => (tree, file) => matter(file))
    .use(remarkGfm)
    .use(remarkRemoveTitle)
    .use(remarkRehype, { allowDangerousHtml: true }) // convert markdown to html
    .use(rehypeRaw) // parse raw html in markdown
    .use(rehypeSlug) // add id to headings
    .use(rehypeExtractToc) // export a toc object
    .use(rehypeExternalAnchor)
    .use(rehypeCompressPunctuation)
    .use(rehypeHighlight)
    .use(rehypePresetMinify)
    .use(rehypeStringify)
    .process(markdown);
  return {
    frontMatter: vf.data.matter as any,
    toc: vf.data.toc as TocEntry[],
    html: String(vf),
  };
};
