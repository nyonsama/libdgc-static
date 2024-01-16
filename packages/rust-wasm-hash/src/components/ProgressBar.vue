<script setup lang="ts">
export interface Props {
  percentage?: number;
  showPercentage?: boolean;
}
withDefaults(defineProps<Props>(), {
  showPercentage: false,
  percentage: 0,
});
</script>
<template>
  <div class="relative h-4 flex-1 overflow-hidden rounded bg-neutral-800">
    <div
      class="h-full w-full -translate-x-full bg-[green] transition-all duration-[33.3ms]"
      :style="{ transform: `translateX(-${100 - percentage}%)` }"
    ></div>
    <!-- <div
      class="h-full w-full -translate-x-full bg-[green]"
      :style="{ transform: `translateX(-${(100 - percentage).toFixed(6)}%)` }"
    ></div> -->
    <div
      v-if="showPercentage"
      class="absolute inset-0 flex items-center justify-center text-center align-middle font-mono"
    >
      <div>%{{ percentage.toFixed(2) }}</div>
    </div>
  </div>
</template>
<style scoped></style>
