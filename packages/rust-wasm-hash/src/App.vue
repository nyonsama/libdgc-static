<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import DigestWorker from "./worker?worker";
import {
  DigestAlgorithm,
  CryptoJSDigestAlgorithm,
  WasmDigestAlgorithm,
  NativeDigestAlgorithm,
  MainMessage,
  WorkerMessage,
  nativeDigestAlgorithms,
  wasmDigestAlgorithms,
  cryptoJSDigestAlgorithms,
  NativeMainMessage,
  WasmMainMessage,
  CryptoJSMainMessage,
  Backend,
} from "./types";
import ProgressBar from "./components/ProgressBar.vue";
import { filesize } from "filesize";

interface Task {
  info: Omit<MainMessage, "type">;
  onMessage: (e: MessageEvent<WorkerMessage>) => void;
  onStart?: () => void;
}
interface WorkerInfo {
  index: number;
  state: "idle" | "busy";
  task: Task | null;
}
class DigestWorkerPool {
  #workerMap: Map<Worker, WorkerInfo> = new Map();
  #waitingTasks: Task[] = [];
  constructor() {
    this.#initWorkers();
  }
  #initWorkers() {
    const workerCount = navigator.hardwareConcurrency;
    const workerList = new Array(workerCount)
      .fill(null)
      .map(() => new DigestWorker());
    for (const worker of workerList) {
      worker.addEventListener("error", this.#getWorkerErrorHandler(worker));
      worker.addEventListener(
        "messageerror",
        this.#getWorkerMessageErrorHandler(worker),
      );
      worker.addEventListener("message", this.#getWorkerMessageHandler(worker));
    }
    this.#workerMap = new Map(
      new Array(workerCount)
        .fill(null)
        .map((_, index) => [
          workerList[index],
          { index, state: "idle", task: null },
        ]),
    );
    this.#waitingTasks = [];
  }

  #getWorkerErrorHandler(worker: Worker) {
    return (e: ErrorEvent) => {
      const info = this.#workerMap.get(worker);
      console.error("worker error", info, e);
    };
  }
  #getWorkerMessageErrorHandler(worker: Worker) {
    return (e: MessageEvent<any>) => {
      const info = this.#workerMap.get(worker);
      console.error("worker messageerror", info, e);
    };
  }
  #getWorkerMessageHandler(worker: Worker) {
    return (e: MessageEvent<WorkerMessage>) => {
      const task = this.#workerMap.get(worker)?.task;
      if (task) {
        task.onMessage(e);
      }
      if (e.data.type === "finish") {
        const info = this.#workerMap.get(worker)!;
        if (info.task?.onMessage) {
          worker.removeEventListener("message", info.task.onMessage);
        }
        info.state = "idle";
        info.task = null;
        const waitingTask = this.#waitingTasks.shift();
        if (waitingTask) {
          this.pushTask(waitingTask);
        }
      }
    };
  }
  pushTask(task: Task) {
    for (const [worker, workerInfo] of this.#workerMap) {
      if (workerInfo.state === "idle") {
        task.onStart?.();
        workerInfo.task = task;
        // worker.addEventListener("message", task.onMessage);
        worker.postMessage({ type: "main", ...task.info });
        workerInfo.state = "busy";
        return;
      }
    }
    // 没有空闲的worker
    this.#waitingTasks.push(task);
  }
  cancelAll() {
    this.#waitingTasks = [];
    for (const [worker] of this.#workerMap) {
      worker.terminate();
    }
    this.#workerMap.clear();
    this.#initWorkers();
  }
}

type FileHashStateBase = {
  state: "created" | "computing" | "finished";
  result: string | null;
  percentage: number | null;
  elapsedTime: number | null; // second
};
type WasmFileHashState = {
  algorithm: WasmMainMessage["algorithm"];
  backend: "wasm";
} & FileHashStateBase;
type NativeFileHashState = {
  algorithm: NativeMainMessage["algorithm"];
  backend: "native";
} & FileHashStateBase;
type CryptoJSFileHashState = {
  algorithm: CryptoJSMainMessage["algorithm"];
  backend: "crypto-es";
} & FileHashStateBase;
type FileHashState =
  | WasmFileHashState
  | NativeFileHashState
  | CryptoJSFileHashState;
interface FileState {
  hashes: Array<FileHashState>;
}
const fileMap = ref<Map<File, FileState>>(new Map());

const workerPool = new DigestWorkerPool();

const fileInput = ref<HTMLInputElement | null>(null);

const fileChange = () => {
  const files = fileInput.value?.files;
  if (!files) {
    return;
  }
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const hashes: FileState["hashes"] = [];
    fileMap.value.set(file, {
      hashes,
    });
    for (const [backend, algorithms] of Object.entries(
      selectedAlgorithms.value,
    )) {
      for (const algorithm of Object.keys(algorithms) as Array<
        keyof typeof algorithms
      >) {
        if (algorithms[algorithm]) {
          hashes.push({
            backend: backend as any,
            algorithm,
            result: null,
            elapsedTime: null,
            percentage: null,
            state: "created",
          });
        }
      }
    }
  }
};
const onStart = () => {
  for (const [file, { hashes }] of fileMap.value.entries()) {
    for (const hash of hashes) {
      if (hash.result || hash.state !== "created") {
        continue;
      }
      if (hash.backend === "wasm") {
        hash.percentage = 0;
      }
      let startTime = null;
      workerPool.pushTask({
        info: { file, backend: hash.backend, algorithm: hash.algorithm },
        onStart: () => {
          hash.state = "computing";
          startTime = performance.now();
          const getTime = () => {
            hash.elapsedTime = (performance.now() - startTime!) / 1000;
            if (hash.state !== "finished") {
              requestAnimationFrame(getTime);
            }
          };
          requestAnimationFrame(getTime);
        },
        onMessage: (e) => {
          // const elapsedTime = (performance.now() - startTime) / 1000;
          // hash.elapsedTime = elapsedTime;
          const { type } = e.data;
          if (type === "progress") {
            const { percentage } = e.data;
            hash.percentage = percentage;
          } else if (type === "finish") {
            // clearInterval(token);
            const { result } = e.data;
            hash.state = "finished";
            hash.result = result;
            const elapsedTime = (performance.now() - startTime!) / 1000;
            hash.elapsedTime = elapsedTime;
          }
        },
      });
    }
  }
};
onMounted(() => {});
const hashLengths: Record<DigestAlgorithm, number> = {
  MD5: 32,
  "SHA-1": 40,
  "SHA-256": 64,
  "SHA-384": 96,
  "SHA-512": 128,
  SM3: 64,
};

const backendDisplayName: Record<Backend, string> = {
  "crypto-es": "Crypto-ES",
  native: "Native",
  wasm: "WASM",
};

const selectedAlgorithms = ref({
  native: Object.fromEntries(
    nativeDigestAlgorithms.map((s) => [s, false]),
  ) as Record<NativeDigestAlgorithm, boolean>,
  wasm: Object.fromEntries(
    wasmDigestAlgorithms.map((s) => [s, false]),
  ) as Record<WasmDigestAlgorithm, boolean>,
  "crypto-es": Object.fromEntries(
    cryptoJSDigestAlgorithms.map((s) => [s, false]),
  ) as Record<CryptoJSDigestAlgorithm, boolean>,
});

watch(
  selectedAlgorithms,
  (value) => {
    for (const [_, fileData] of fileMap.value.entries()) {
      const { hashes } = fileData;
      const newHashes: typeof hashes = [];
      for (const backend of ["native", "wasm", "crypto-es"] as const) {
        const algorithms = value[backend];
        for (const algorithm of Object.keys(algorithms) as Array<
          keyof typeof algorithms
        >) {
          if ((value[backend] as any)[algorithm]) {
            const existingHashStates = hashes.filter(
              (hash) =>
                hash.backend === backend && hash.algorithm === algorithm,
            );
            if (existingHashStates.length === 0) {
              newHashes.push({
                backend,
                algorithm,
                result: null,
                elapsedTime: null,
                percentage: null,
                state: "created",
              });
            } else {
              newHashes.push(...existingHashStates);
            }
          }
        }
      }
      fileData.hashes = newHashes;
    }
  },
  { deep: true },
);
</script>

<template>
  <div class="max-w-full p-4 text-neutral-100">
    <div class="flex gap-2">
      <input
        ref="fileInput"
        type="file"
        multiple
        class="hidden"
        @change="fileChange"
      />
      <button
        class="rounded border border-neutral-400 px-2 leading-8"
        @click="fileInput?.click()"
      >
        选择文件
      </button>
      <button
        class="rounded border border-[green] px-2 leading-8 text-[green]"
        @click="onStart"
      >
        开始
      </button>
      <button
        class="rounded border border-neutral-400 px-2 leading-8 text-neutral-400"
        @click="
          fileMap.clear();
          workerPool.cancelAll();
          fileInput!.value = '';
        "
      >
        清空
      </button>
    </div>
    <div class="mb-2 mt-3 bg-neutral-800 py-1 pl-2 text-lg">可用算法</div>
    <div
      v-for="(algorithms, backend, index) in selectedAlgorithms"
      :key="backend"
    >
      <hr v-if="index !== 0" class="mb-1 border-neutral-700" />
      <div class="mb-1 text-base text-neutral-300">
        {{ backendDisplayName[backend] }} 后端
        <span
          v-if="backend === 'native'"
          class="text-sm italic text-neutral-500"
          >需要将文件全部读入内存，请不要选择过大的文件</span
        >
      </div>
      <div class="mb-2 flex flex-wrap gap-2">
        <button
          v-for="(selected, algorithm) in algorithms"
          :key="algorithm"
          :class="[
            'flex items-center rounded border px-2 leading-8',
            selected
              ? 'border-[green] text-[green]'
              : 'border-neutral-400 text-neutral-400',
          ]"
          @click="algorithms[algorithm] = !algorithms[algorithm]"
        >
          {{ algorithm }}
        </button>
      </div>
    </div>

    <div class="my-3 bg-neutral-800 py-1 pl-2 text-lg">已选文件</div>
    <div v-if="fileMap.size === 0">空</div>
    <div class="flex flex-col gap-2">
      <div
        v-for="[file, { hashes }] in fileMap"
        class="flex flex-col rounded-lg border border-neutral-500 px-3 pb-3 pt-3"
      >
        <div
          class="mb-4 break-all text-lg font-medium leading-6 text-neutral-100"
        >
          {{ file.name }}
        </div>
        <div class="flex flex-col">
          <div class="flex text-sm text-neutral-300">
            <div>大小：{{ filesize(file.size, { base: 2 }) }}</div>
          </div>
          <template v-for="hash in hashes">
            <hr class="my-2 border-neutral-700" />
            <div class="flex flex-col rounded-lg border-neutral-500">
              <div class="mb-2 flex items-end">
                <div>
                  <span class="mr-2 text-neutral-300">{{
                    hash.algorithm
                  }}</span>
                  <span
                    class="rounded border border-neutral-400 px-1 text-xs text-neutral-300"
                    >{{ backendDisplayName[hash.backend] }}</span
                  >
                </div>
                <div
                  v-if="hash.elapsedTime !== null"
                  class="flex-1 text-right text-sm text-neutral-300"
                >
                  耗时
                  <span class="font-mono"
                    >{{ hash.elapsedTime.toFixed(2) }}s</span
                  >
                </div>
              </div>
              <div class="relative">
                <div
                  v-if="hash.state === 'finished'"
                  class="break-all font-mono text-sm text-neutral-400"
                >
                  {{ hash.result }}
                </div>
                <template v-else>
                  <div
                    class="break-all font-mono text-sm text-neutral-400 opacity-0"
                  >
                    {{ "0".repeat(hashLengths[hash.algorithm]) }}
                  </div>
                  <div class="absolute inset-0 flex flex-col justify-center">
                    <div
                      v-if="hash.state === 'created'"
                      class="bg-neutral-800 text-center"
                    >
                      等待开始
                    </div>
                    <template v-if="hash.state === 'computing'">
                      <ProgressBar
                        v-if="hash.percentage !== null"
                        :percentage="hash.percentage"
                        show-percentage
                      />
                      <div v-else class="text-center">正在计算</div>
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-card {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}
.file-name {
  margin-bottom: 0.5rem;
}
.file-size {
  margin-bottom: 0.25rem;
  font-size: 14px;
}
.file-hash {
  display: flex;
  font-size: 14px;
}
</style>
