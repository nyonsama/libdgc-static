import { sortProtoSchema } from "./sort.js";

/** @type {HTMLInputElement} */
const fileInput = document.getElementById("fileInput");
const resultList = document.getElementById("resultList");

const h = (tag, attributes = {}, children = []) => {
  const node = document.createElement(tag);
  for (const key of Object.keys(attributes)) {
    const value = attributes[key];
    if (key === "on") {
      for (const eventType of Object.keys(value)) {
        node.addEventListener(eventType, value[eventType]);
      }
    } else {
      node.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (child instanceof Node) {
      node.appendChild(child);
    } else {
      node.appendChild(new Text(String(child)));
    }
  }
  return node;
};

let sortResults = [];
let isSorting = false;

fileInput.addEventListener("change", async () => {
  if (isSorting) {
    return;
  }
  isSorting = true;

  // 清空
  resultList.textContent = "";
  sortResults = [];
  downloadButton.style.display = "none";
  downloadDemoButton.style.display = "none";

  if (!fileInput.files?.length) {
    isSorting = false;
    downloadDemoButton.style.display = "";
    return;
  }

  const files = [...fileInput.files];
  sortResults = await Promise.all(
    files.map(async (file) => {
      const source = await file.text();
      return sortProtoSchema(source);
    }),
  );

  resultList.appendChild(h("p", {}, ["⬇️ 排序结果（点击文件名展开）"]));

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const result = sortResults[index];

    const copyResult = () => {
      return navigator.clipboard.writeText(result);
    };
    const details = h("details", {}, [
      h("summary", {}, [
        file.name,
        h("button", { on: { click: copyResult } }, ["复制"]),
      ]),
      h("pre", {}, [h("code", { class: "language-protobuf" }, [result])]),
    ]);

    resultList.appendChild(details);
  }
  isSorting = false;
  downloadButton.style.display = "";

  getHljs()?.highlightAll();
});

const JSZipPromise = import("https://esm.sh/jszip@3.10.1");
let getHljs = () => null;
(async () => {
  const { default: hljs } = await import(
    "https://esm.sh/highlight.js@11.11.1/lib/core"
  );
  const { default: protobuf } = await import(
    "https://esm.sh/highlight.js@11.11.1/lib/languages/protobuf"
  );
  hljs.registerLanguage("protobuf", protobuf);
  getHljs = () => hljs;
})();

const downloadButton = document.getElementById("downloadResult");
downloadButton.addEventListener("click", async (e) => {
  if (!sortResults.length) {
    return;
  }
  if (isSorting) {
    return;
  }

  if (sortResults.length === 1) {
    const blob = new Blob([sortResults[0]]);
    downloadBlob(fileInput.files[0].name, blob);
  } else {
    const JSZip = (await JSZipPromise).default;
    const zip = new JSZip();
    const sortedFiles = zip.folder("sorted_proto");

    for (let index = 0; index < sortResults.length; index++) {
      const sortedSource = sortResults[index];
      const file = fileInput.files[index];
      sortedFiles.file(file.name, sortedSource);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadBlob("sorted_proto.zip", zipBlob);
  }
});

const downloadBlob = (fileName, blob) => {
  const a = document.createElement("a");
  a.setAttribute("download", fileName);
  const url = URL.createObjectURL(blob);
  a.setAttribute("href", url);
  a.click();
};

const downloadDemoButton = document.getElementById("downloadDemo");
downloadDemoButton.addEventListener("click", () => {
  const a = document.createElement("a");
  a.setAttribute("download", "test.proto");
  a.setAttribute("href", "./test.proto");
  a.click();
});
