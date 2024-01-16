import {
  MainMessage,
  WasmDigestAlgorithm,
  NativeDigestAlgorithm,
  WorkerMessage,
  CryptoJSDigestAlgorithm,
} from "./types";
import * as wasm from "./wasm/wasmhash/pkg/wasmhash";
// import CryptoJS from "crypto-js";
import CryptoJS from "crypto-es";

onmessage = async (e) => {
  const msg = e.data as MainMessage;
  switch (msg.backend) {
    case "wasm":
      wasmDigest(msg.file, msg.algorithm);
      break;
    case "native":
      nativeDigest(msg.file, msg.algorithm);
      break;
    case "crypto-es":
      cryptoJSDigest(msg.file, msg.algorithm);
      break;
    default:
      throw new Error(`unknown message ${msg}`);
  }
};

// let lastPostMessageTime = performance.now();
// let lastMessage: WorkerMessage | null = null;

// const postMessageWithThreshould = (msg: WorkerMessage) => {
//   const now = performance.now();
//   if (now - lastPostMessageTime > 100) {
//     postMessage(msg);
//     lastPostMessageTime = now;
//   }
// };

// const msgList: WorkerMessage[] = [];
const sendResultToMain = (result: string) => {
  postMessage({ type: "finish", result } as WorkerMessage);
  // console.log(msgList);
};
const sendProgressToMain = (percentage: number) => {
  const msg: WorkerMessage = { type: "progress", percentage };
  // msgList.push(msg);
  postMessage(msg);
};

const mapWasmEnum = (algorithm: WasmDigestAlgorithm) => {
  switch (algorithm) {
    case "MD5":
      return wasm.DigestAlgorithm.MD5;
    case "SHA-1":
      return wasm.DigestAlgorithm.SHA1;
    case "SHA-256":
      return wasm.DigestAlgorithm.SHA256;
    case "SHA-384":
      return wasm.DigestAlgorithm.SHA384;
    case "SHA-512":
      return wasm.DigestAlgorithm.SHA512;
    case "SM3":
      return wasm.DigestAlgorithm.SM3;
    default:
      throw new Error("unreachable");
  }
};

const wasmDigest = async (file: File, algorithm: WasmDigestAlgorithm) => {
  const result = await wasm.digest(
    mapWasmEnum(algorithm),
    file.stream(),
    (processed_size: number) => {
      const percentage = (processed_size / file.size) * 100;
      sendProgressToMain(percentage);
    },
  );
  sendResultToMain(result);
};

const hex = (u8Array: Uint8Array) => {
  const array = Array.from(u8Array);
  return array.map((b) => b.toString(16).padStart(2, "0")).join(""); // convert bytes to hex string
};

const nativeDigest = async (file: File, algorithm: NativeDigestAlgorithm) => {
  const data = await file.arrayBuffer();
  const result = await crypto.subtle.digest(algorithm, data);
  const resultHex = hex(new Uint8Array(result));
  sendResultToMain(resultHex);
};

const cryptoJSDigest = async (
  file: File,
  algorithm: CryptoJSDigestAlgorithm,
) => {
  let hasher: CryptoJS.lib.Hasher;
  switch (algorithm) {
    case "MD5":
      hasher = CryptoJS.algo.MD5.create();
      break;
    case "SHA-1":
      hasher = CryptoJS.algo.SHA1.create();
      break;
    case "SHA-256":
      hasher = CryptoJS.algo.SHA256.create();
      break;
    case "SHA-384":
      hasher = CryptoJS.algo.SHA384.create();
      break;
    case "SHA-512":
      hasher = CryptoJS.algo.SHA512.create();
      break;
    default:
      throw new Error("unreachable");
  }

  const stream = file.stream();
  const reader = stream.getReader();
  let processedSize = 0;
  sendProgressToMain(0);
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    processedSize += value.byteLength;
    sendProgressToMain((processedSize / file.size) * 100);
    const wordArray = CryptoJS.lib.WordArray.create(value);
    hasher.update(wordArray);
  }
  const result = hasher.finalize();
  const resultString = CryptoJS.enc.Hex.stringify(result);
  sendResultToMain(resultString);
};
