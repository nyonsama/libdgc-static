export const nativeDigestAlgorithms = [
  "SHA-1",
  "SHA-256",
  "SHA-384",
  "SHA-512",
] as const;
export type NativeDigestAlgorithm = (typeof nativeDigestAlgorithms)[number];
export const wasmDigestAlgorithms = [
  "MD5",
  "SHA-1",
  "SHA-256",
  "SHA-384",
  "SHA-512",
  "SM3",
] as const;
export type WasmDigestAlgorithm = (typeof wasmDigestAlgorithms)[number];
export const cryptoJSDigestAlgorithms = [
  "MD5",
  "SHA-1",
  "SHA-256",
  "SHA-384",
  "SHA-512",
] as const;
export type CryptoJSDigestAlgorithm = (typeof cryptoJSDigestAlgorithms)[number];

export type DigestAlgorithm =
  | NativeDigestAlgorithm
  | WasmDigestAlgorithm
  | CryptoJSDigestAlgorithm;

export type ProgressMessage = {
  type: "progress";
  percentage: number;
};

export type FinishMessage = {
  type: "finish";
  result: string;
};

// message from worker
export type WorkerMessage = ProgressMessage | FinishMessage;

export type Backend = "native" | "wasm" | "crypto-es";
export type MainMessageBase = {
  type: "main";
  file: File;
  backend: Backend;
};

export type NativeMainMessage = {
  backend: "native";
  algorithm: NativeDigestAlgorithm;
} & MainMessageBase;

export type WasmMainMessage = {
  backend: "wasm";
  algorithm: WasmDigestAlgorithm;
} & MainMessageBase;

export type CryptoJSMainMessage = {
  backend: "crypto-es";
  algorithm: CryptoJSDigestAlgorithm;
} & MainMessageBase;

// message from main thread
export type MainMessage =
  | NativeMainMessage
  | WasmMainMessage
  | CryptoJSMainMessage;
