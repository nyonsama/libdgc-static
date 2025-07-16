/** @jsxImportSource hastscript */
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
import { SKIP, visit } from "unist-util-visit";
import { toHtml } from "hast-util-to-html";
import { matter } from "vfile-matter";
import { TocEntry } from "../types";
import {
  allCompressibleCharacters,
  rehypeCompressPunctuation,
} from "./compressPunctuation";
import path from "path";
import { promisify } from "util";
import _sizeOf from "image-size";
import { visitParents } from "unist-util-visit-parents";
import { h } from "hastscript";

const sizeOf = promisify(_sizeOf);

const remarkRemoveTitle = () => (tree: mdast.Root, file: VFile) => {
  let titleIndex = tree.children.findIndex(
    (c) => c.type === "heading" && c.depth === 1,
  );
  if (titleIndex !== -1) {
    tree.children.splice(titleIndex, 1);
  }
};

const rehypeImgSize =
  (options: { basePath: string }) => async (tree: hast.Root, file: VFile) => {
    const imgFileMap = new Map<
      string,
      { width: number; height: number } | null
    >();
    visit(tree, "element", (node) => {
      const { src } = node.properties;
      if (node.tagName === "img" && typeof src === "string") {
        imgFileMap.set(src, null);
      }
    });
    for (const [src] of imgFileMap) {
      const imgPath = path.join(options.basePath, src);
      const result = (await sizeOf(imgPath))!;
      if (result.images) {
        // 对于ico等包含多种大小的图片，取最大的
        const { width, height } = result.images.reduce((prev, curr) => {
          if (curr.height! * curr.width! > prev.height! * prev.width!) {
            return curr;
          } else {
            return prev;
          }
        });
        imgFileMap.set(src, { width: width!, height: height! });
      } else {
        const { width, height } = result;
        imgFileMap.set(src, { width: width!, height: height! });
      }
    }
    visit(tree, "element", (node) => {
      const { src } = node.properties;
      if (node.tagName === "img" && typeof src === "string") {
        const { height, width } = imgFileMap.get(src)!;
        node.properties.height = height;
        node.properties.width = width;
        node.properties["data-state"] = "inactive";
      }
    });
  };

// 给img包上figure
const rehypeWrapImg = () => (tree: hast.Root, file: VFile) => {
  visit(tree, "element", (node) => {
    for (let index = 0; index < node.children.length; index++) {
      const child = node.children[index];
      if (child.type === "element" && child.tagName === "img") {
        const caption = child.properties.alt;
        if (typeof caption === "string") {
          child.properties.title ??= caption;
        }
        // 手动设置了class或style的话就不处理
        if (!child.properties.class && !child.properties.style) {
          const figure = (<figure>{child}</figure>) as hast.Element;
          if (typeof caption === "string") {
            figure.children.push(
              (<figcaption>{caption}</figcaption>) as hast.Element,
            );
          }
          node.children[index] = figure;
        }
      }
    }
    return SKIP;
  });
};

const rehypeIFrame = () => (tree: hast.Root, file: VFile) => {
  visitParents(tree, "element", (node, parents) => {
    if (node.tagName === "iframe") {
      node.properties.title ??= "showcase";
      const directParent = parents.at(-1)!;
      directParent.children.splice(
        directParent.children.indexOf(node),
        1,
        (
          <div class="iframe-wrapper relative">
            {node}
            <div class="pointer-events-none absolute inset-0 flex select-none items-center justify-center border border-zinc-500 opacity-0">
              <div>Loading...</div>
            </div>
          </div>
        ) as hast.Element,
      );
      return SKIP;
    }
  });
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
          class: `not-prose inline-block h-3 w-3 align-baseline ${needCompress ? "ml-0" : "ml-1"}`,
          src: "/assets/img/external-link.svg",
          alt: "外部链接",
        });
        // const icon = (
        //   <img
        //     class={`not-prose inline-block h-3 w-3 align-baseline ${needCompress ? "ml-0" : "ml-1"}`}
        //     src="/assets/img/external-link.svg"
        //     alt="外部链接"
        //   />
        // ) as hast.Element;
        node.children.push(icon);
        node.children.push({ type: "text", value: " " });
      }
    }
  });
};

export const renderMarkdown = async (markdown: string, basePath: string) => {
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
    .use(rehypeImgSize, { basePath })
    .use(rehypeWrapImg) // wrap <img> with <figure>
    .use(rehypeIFrame)
    .use(rehypeExternalAnchor)
    .use(rehypeCompressPunctuation)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(markdown);
  return {
    frontMatter: vf.data.matter as any,
    toc: vf.data.toc as TocEntry[],
    html: String(vf),
  };
};
