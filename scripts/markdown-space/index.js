import { parsers as originalParsers } from "prettier/plugins/markdown";
import {  visit } from "unist-util-visit";

export { languages, options, printers } from "prettier/plugins/markdown";

const cjRegex = /\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u;

const textRegex = new RegExp(
  [
    "(",
    "(\\p{Script=Han}|\\p{Script=Hiragana}|\\p{Script=Katakana})",
    "[a-zA-Z0-9]",
    ")|(",
    "[a-zA-Z0-9]",
    "(\\p{Script=Han}|\\p{Script=Hiragana}|\\p{Script=Katakana})",
    ")",
  ].join(""),
  "u",
);

const inlineNodes = [
  "emphasis",
  "inlineCode", // leaf
  "link",
  "strong",
  "strikethrough",
];

// aaa `aaa` textEnd -> inlineStart
// `aaa` aaa inlineEnd -> testStart
// `aaa` `aaa` inlineEnd -> inlineStart

export const parsers = {
  ...originalParsers,
  markdown: {
    ...originalParsers.markdown,
    parse: async (text, options) => {
      const ast = await originalParsers.markdown.parse(text, options);

      visit(ast, "text", (node) => {
        node.value = node.value.replace(
          textRegex,
          (match) => `${match[0]} ${match[1]}`,
        );
      });

      const flatten = (() => {
        /** @import { Nodes } from '@types/mdast' */
        /** @type {{ type: 'leaf'|'enter'|'exit', node: Nodes, parent: Nodes|null }[]} */
        const result = [];
        const inner = (node, parent = null) => {
          if (!node.children?.length) {
            result.push({ type: "leaf", node, parent });
            return;
          } else {
            result.push({ type: "enter", node, parent });
          }

          for (const child of node.children) {
            inner(child, node);
          }

          result.push({ type: "exit", node });
        };
        inner(ast);
        return result;
      })();

      const getNearLeafPairs = () => {
        const leafPairs = (function* () {
          let lastLeafIndex = -1;
          for (let index = 0; index < flatten.length; index++) {
            const node = flatten[index];

            if (node.type === "leaf") {
              if (lastLeafIndex === -1) {
                lastLeafIndex = index;
              } else {
                yield [lastLeafIndex, index];
                lastLeafIndex = index;
              }
            }
          }
        })();

        const nearLeafPairs = leafPairs.filter(([start, end]) => {
          const gapLength = end - start - 1;
          if (gapLength < 1) {
            return true;
          }

          const gap = flatten.slice(start + 1, end);
          const isGapAllInlineAndNotLeaf = gap.every(
            ({ node, type }) =>
              inlineNodes.includes(node.type) && type !== "leaf",
          );
          return isGapAllInlineAndNotLeaf;
        });
        return nearLeafPairs;
      };

      {
        // 例：汉字`aaa`汉字
        // 这里给`aaa`两边加空格
        const textInlineCodePairs = getNearLeafPairs().filter(
          ([start, end]) => {
            const startNode = flatten[start].node;
            const endNode = flatten[end].node;
            return (
              (startNode.type === "text" && endNode.type === "inlineCode") ||
              (startNode.type === "inlineCode" && endNode.type === "text")
            );
          },
        );
        for (const [start, end] of textInlineCodePairs) {
          const startNode = flatten[start].node;
          const endNode = flatten[end].node;
          if (
            startNode.type === "text" &&
            cjRegex.test(startNode.value.at(-1))
          ) {
            startNode.value += " ";
          } else if (
            endNode.type === "text" &&
            cjRegex.test(endNode.value.at(0))
          ) {
            endNode.value = " " + endNode.value;
          }
        }
      }

      const textPairs = getNearLeafPairs().filter(
        ([start, end]) =>
          flatten[start].node.type === "text" &&
          flatten[end].node.type === "text",
      );

      const hybridTextPairs = textPairs.filter(([start, end]) => {
        const startNode = flatten[start].node;
        const endNode = flatten[end].node;

        // 两个节点之间有需要插空格的字符混在一起
        return (
          (cjRegex.test(startNode.value.at(-1)) &&
            /[a-zA-Z0-9]/.test(endNode.value[0])) ||
          (/[a-zA-Z0-9]/.test(startNode.value.at(-1)) &&
            cjRegex.test(endNode.value[0]))
        );
      });

      for (const [start, end] of hybridTextPairs) {
        const startNode = flatten[start].node;
        const endNode = flatten[end].node;

        // 匹配 startText<code><strong><blah>endText
        const isGapAllEnter = gap.every(({ type }) => type === "enter");

        // 匹配 startText</code></strong></blah>endText
        const isGapAllExit = gap.every(({ type }) => type === "exit");

        // 匹配 startText</code></strong></blah><blah><strong><code>endText
        let isGapAllExitThenEnter = true;
        {
          for (let index = 1; index < gap.length; index++) {
            const lastFlatNode = gap[index - 1];
            const flatNode = gap[index];
            if (lastFlatNode.type === "enter" && flatNode.type === "exit") {
              isGapAllExitThenEnter = false;
            }
          }
        }

        if (isGapAllEnter) {
          if (!startNode.value.endsWith(" ")) {
            startNode.value += " ";
          }
        } else if (isGapAllExit) {
          if (!endNode.value.startsWith(" ")) {
            endNode.value = " " + endNode.value;
          }
        } else if (isGapAllExitThenEnter) {
          /** @type {typeof gap[0]} */
          let insertAfterMe = null;
          {
            for (let index = 1; index < gap.length; index++) {
              const lastFlatNode = gap[index - 1];
              const flatNode = gap[index];
              if (lastFlatNode.type !== flatNode.type) {
                insertAfterMe = lastFlatNode;
                break;
              }
            }
          }

          const insertAfterIndex =
            insertAfterMe?.parent?.children?.findIndex?.(
              (node) => node === insertAfterMe.node,
            ) ?? -1;
          if (insertAfterIndex === -1) {
            // should not happen
            continue;
          }

          lastFlatNode.parent.children.splice(insertAfterIndex + 1, 0, {
            type: "text",
            value: " ",
          });
        }
      }

      return ast;
    },
  },
};
