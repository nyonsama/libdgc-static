import type hast from "hast";
import rehypeRaw from "rehype-raw";
import { Processor, Compiler, unified } from "unified";
import { visit } from "unist-util-visit";
import { inlineTags } from "./compressPunctuation";
import rehypeParse from "rehype-parse";

export function rehypeAbstract(this: any) {
  const self: Processor<undefined, undefined, undefined, hast.Root, string> =
    this;
  const compiler: Compiler<hast.Root, string> = (tree) => {
    const textList: string[][] = [[]];
    visit(tree, (node) => {
      if (node.type === "text") {
        textList.at(-1)!.push(node.value);
      } else if (node.type === "element") {
        if (!inlineTags.includes(node.tagName)) {
          textList.push([]);
        }
      }
    });
    const paragraphs = textList
      .filter((e) => e.length !== 0)
      .map((paragraph) => paragraph.join(""));
    const result = paragraphs.join(" ");
    return result;
  };
  self.compiler = compiler;
}

export const generateAbstractFromHtml = async (html: string) => {
  const vf = await unified().use(rehypeParse).use(rehypeAbstract).process(html);
  return String(vf);
};
