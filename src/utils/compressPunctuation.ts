import type hast from "hast";
import { h } from "hastscript";
import { visitParents, SKIP } from "unist-util-visit-parents";
import { VFile } from "vfile";

// 标点挤压：https://www.uisdc.com/chinese-typesetting-3-principle

export const inlineTags = [
  "a",
  "abbr",
  "b",
  "cite",
  "dfn",
  "em",
  "i",
  "label",
  "samp",
  "span",
  "strong",
  "time",
  "var",
];
const 开始夹注符 = "（「【《〈";
const 结束夹注符 = "）」】〉》";
const 顿号句号逗号 = "、。，";
const 分号冒号 = "；：";

export const allCompressibleCharacters =
  开始夹注符 + 结束夹注符 + 顿号句号逗号 + 分号冒号;

export const compressibleRegexpString =
  "(" +
  [
    `[${结束夹注符}][${开始夹注符}${结束夹注符}${顿号句号逗号}${分号冒号}]`,
    `[${开始夹注符}][${开始夹注符}]`,
    `[${顿号句号逗号}][${开始夹注符}${结束夹注符}]`,
    `[${分号冒号}][${开始夹注符}]`,
  ].join(")|(") +
  ")";
const compressibleRegexp = new RegExp(compressibleRegexpString);
export const isCompressible = (str: string) => compressibleRegexp.test(str);

export const rehypeCompressPunctuation =
  () => (tree: hast.Root, file: VFile) => {
    // 上一个相邻的、可以尝试做标点挤压的Text节点
    let lastText = {
      node: null as hast.Text | null,
      parent: null as hast.Element | null,
    };
    visitParents(tree, (node, parents) => {
      const parent = parents.at(-1);
      if (!parent) {
        return;
      }

      // 跳过之前注入的节点
      if (
        parent.type === "element" &&
        parent.tagName === "span" &&
        Array.isArray(parent.properties.className) &&
        parent.properties.className.includes("compress")
      ) {
        return [SKIP];
      }

      // 跨过了一个换行或块级元素，和上一个Text节点不相邻了
      if (node.type === "element" && !inlineTags.includes(node.tagName)) {
        lastText = { node: null, parent: null };
      }

      // 当前节点不是Text，不需要做任何事
      if (node.type !== "text") {
        return;
      }

      // 上个相邻的节点的最后一个标点和当前节点的第一个标点可以挤到一起
      if (
        lastText.node &&
        lastText.parent &&
        isCompressible(lastText.node.value.at(-1) + node.value[0])
      ) {
        // 注入span
        const lastValue = lastText.node.value;
        const childIndex = lastText.parent.children.indexOf(lastText.node);
        lastText.parent.children.splice(
          childIndex + 1,
          0,
          h("span", { class: "compress" }, [lastValue.at(-1)]),
        );
        lastText.node.value = lastValue.slice(0, lastValue.length - 1);
      } else if (isCompressible(node.value)) {
        // 当前节点内有标点可以挤压
        const match = node.value.match(compressibleRegexp)!;

        const matchIndex = match.index ?? node.value.indexOf(match[0]);

        // 注入span
        const newNodes: hast.ElementContent[] = [];
        const head = node.value.slice(0, matchIndex);
        if (head.length > 0) {
          newNodes.push({
            type: "text",
            value: head,
          });
        }
        newNodes.push(h("span", { class: "compress" }, [match[0][0]]));
        const tail = node.value.slice(matchIndex + 1);
        if (tail.length > 0) {
          newNodes.push({
            type: "text",
            value: tail,
          });
        }

        // 已经做了标点挤压，下一段文本不可能和这一段文本标点挤压
        lastText = { node: null, parent: null };

        const childIndex = parent.children.indexOf(node);
        parent.children.splice(childIndex, 1, ...newNodes);
      } else {
        if (parent.type !== "root") {
          lastText = { node, parent };
        }
      }
    });
  };
