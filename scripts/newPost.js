import fs from "node:fs/promises";

const postName = process.argv[2] ?? "new-post";

const postTemplate = `---
title: "标题"
createDate: "yyyy-mm-dd"
tags: ["标签"]
---

<iframe style="width:100%;height:30rem;" src="./assets/embed.html"></iframe>
`;

const embeddedHTMLTemplate = /* html */ `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * {
        color-scheme: dark only;
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0.5rem;
        font-family: sans-serif;
      }
    </style>
  </head>
  <body>
  </body>
</html>

`;

await fs.mkdir(`./posts/${postName}`, { recursive: true });
await fs.writeFile(`./posts/${postName}/index.md`, postTemplate, "utf-8");

await fs.mkdir(`./posts/${postName}/assets`, { recursive: true });
await fs.writeFile(
  `./posts/${postName}/assets/embed.html`,
  embeddedHTMLTemplate,
  "utf-8",
);
