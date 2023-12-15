<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  watchEffect,
} from "vue";

const orientation = ref({ alpha: 0, beta: 0, gamma: 0 });
window.ondeviceorientation = (e) => {
  const { alpha, beta, gamma } = e;
  orientation.value = { alpha: alpha ?? 0, beta: beta ?? 0, gamma: gamma ?? 0 };
};
// const orientationSensor = new RelativeOrientationSensor({ frequency: 1000 });
// const quaternion = ref([0, 0, 0, 0]);
// orientationSensor.onreading = () => {
// quaternion.value = orientationSensor.quaternion ?? [0, 0, 0, 0];
// };
// orientationSensor.start();
// const quaternionRotate = computed(() => {
//   const [x, y, z, w] = quaternion.value;
//   const theta = acos(w) * 2;
//   return [theta, x / sin(theta / 2), y / sin(theta / 2), z / sin(theta / 2)];
// });

const { sign, atan, sin, cos, acos, asin, PI, sqrt, max, min, abs } = Math;
const rad2deg = (rad: number) => (rad / (2 * PI)) * 360;

const api = ref<"GravitySensor" | "DeviceMotion">("GravitySensor");

const acceleration = ref({ x: 0, y: 0, z: 0 });
const baseAcceleration = ref({ x: 0, y: 0, z: 1 });
const relativeAcceleration = computed(() => {
  const raw = acceleration.value;
  const base = baseAcceleration.value;
  const lenXZ = sqrt(raw.x ** 2 + raw.z ** 2);
  const lenYZ = sqrt(raw.y ** 2 + raw.z ** 2);
  if (abs(raw.z) < 1e-5) {
    return { ...raw };
  }
  const x =
    sign(raw.z) * sin(atan(raw.x / raw.z) - atan(base.x / base.z)) * lenXZ;
  const y =
    sign(raw.z) * sin(atan(raw.y / raw.z) - atan(base.y / base.z)) * lenYZ;
  const z =
    sign(raw.z) * cos(atan(raw.y / raw.z) - atan(base.y / base.z)) * lenYZ;
  return { x, y, z };
});
const angles = computed(() => {
  const { x, y, z } = acceleration.value;
  return { xz: atan(x / z), yz: atan(y / z), xy: atan(x / y) };
});
const relativeAngles = computed(() => {
  const { x, y, z } = relativeAcceleration.value;
  return { xz: atan(x / z), yz: atan(y / z), xy: atan(x / y) };
});
const relativeHorizontalAngle = computed(() => {
  const { x, y, z } = relativeAcceleration.value;
  // if (z < 1e-5) {
  //   return 0;
  // }
  return atan(sqrt(x ** 2 + y ** 2) / z);
});

const normalize = (x: number, y: number, z: number) => {
  const ratio = sqrt(x ** 2 + y ** 2 + z ** 2);
  return [x / ratio, y / ratio, z / ratio];
};

const bubble = ref<HTMLDivElement | null>(null);
const transform = computed(() => {
  const { x, y, z } = relativeAcceleration.value;
  let [nx, ny, nz] = normalize(x, y, z);
  const rotateAngle = asin(sqrt(nx ** 2 + ny ** 2) / 1);

  return `translate(-50%, -50%) translate(${nx * 80}px, ${
    -ny * 80
  }px) rotate3D(${ny}, ${nx}, 0, ${rotateAngle}rad) `;
});

const statics = ref({
  sampleRate: 0,
});

const setHorizontal = () => {
  baseAcceleration.value = { ...acceleration.value };
};
const reset = () => {
  baseAcceleration.value = { x: 0, y: 0, z: 1 };
};

const hasDeviceMotion = ref(typeof DeviceMotionEvent !== "undefined");
const hasGravitySensor = ref(typeof GravitySensor !== "undefined");
const hasPermission = ref(false);

let sampleCount = 0;
let lastSampleRateTime = 0;
const intervalId = setInterval(() => {
  const now = performance.now();
  if (lastSampleRateTime === 0) {
    statics.value.sampleRate = 0;
  } else {
    statics.value.sampleRate =
      sampleCount / ((now - lastSampleRateTime) / 1000);
  }
  lastSampleRateTime = now;
  sampleCount = 0;
}, 1000);

const gravityRef = shallowRef<GravitySensor | null>(null);

watch(
  [api],
  async () => {
    if (api.value === "DeviceMotion") {
      gravityRef.value?.stop();
      window.ondevicemotion = (event) => {
        sampleCount += 1;
        const { x, y, z } = event.accelerationIncludingGravity ?? {};
        acceleration.value = { x: x ?? 0, y: y ?? 0, z: z ?? 0 };
      };
    } else if (api.value === "GravitySensor") {
      window.ondevicemotion = null;
      const permissionStatus = await navigator.permissions.query({
        name: "accelerometer" as unknown as PermissionName,
      });
      if (permissionStatus.state !== "granted") {
        return;
      }
      hasPermission.value = true;
      const gravity = new GravitySensor({ frequency: 1000 });
      gravityRef.value = gravity;
      gravity.addEventListener("reading", () => {
        sampleCount += 1;
        const { x = 0, y = 0, z = 0 } = gravity;
        acceleration.value = { x, y, z };
      });
      gravity.start();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  clearInterval(intervalId);
  gravityRef.value?.stop();
  gravityRef.value?.removeEventListener("reading", null);
  window.ondevicemotion = null;
});
// 2维旋转矩阵
// x2 = r cos(a1+sigma) = r (cos(a1)*cos(sigma) - sin(a1) * sin(sigma))
// = sqrt(x1**2 + y1**2) * (x1 / sqrt(x1**2 + y1**2) * cos(sigma) - y1 / sqrt(x1**2 + y1**2) * sin(sigma))
// = x1 * cos(sigma) - y1 * sin(sigma)
// y2 = r sin(a1+sigma) = r (sin(a1) * cos(sigma) + cos(a1) * sin(sigma))
// = y1 * cos(sigma) + x1 * sin(sigma)
//
// [x1, y1] * [cos(sigma), sin(sigma)  = [x2, y2]
//             -sin(sigma),cos(sigma)]
//
</script>
<template>
  <div class="mb-4">
    <div>当前使用的传感器API：{{ api }}</div>
    <button class="mr-4" @click="api = 'GravitySensor'">
      使用GravitySensor
    </button>
    <button @click="api = 'DeviceMotion'">使用DeviceMotion</button>
  </div>
  <div v-if="api == 'DeviceMotion' && !hasDeviceMotion">
    你的浏览器不支持DeviceMotion
  </div>
  <div v-else-if="api === 'GravitySensor' && !hasGravitySensor">
    你的浏览器不支持GravitySensor
  </div>
  <div v-else-if="api === 'GravitySensor' && !hasPermission">
    没有使用GravitySensor的权限
  </div>
  <div v-else>
    <div class="monospace mb-4">
      <div>加速度：</div>
      <div>
        a:
        {{
          sqrt(
            acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2,
          ).toFixed(4)
        }}m/s<sup>2</sup>
      </div>
      <div>a<sub>x</sub>: {{ acceleration.x.toFixed(4) }}m/s<sup>2</sup></div>
      <div>a<sub>y</sub>: {{ acceleration.y.toFixed(4) }}m/s<sup>2</sup></div>
      <div>a<sub>z</sub>: {{ acceleration.z.toFixed(4) }}m/s<sup>2</sup></div>
    </div>
    <!-- <div>
      orientation
      <div>alpha: {{ orientation.alpha }}</div>
      <div>beta: {{ orientation.beta }}</div>
      <div>gamma: {{ orientation.gamma }}</div>
    </div> -->
    <!-- <div>
      quaternion
      <div>x: {{ quaternion[0] }}</div>
      <div>y: {{ quaternion[1] }}</div>
      <div>z: {{ quaternion[2] }}</div>
      <div>w: {{ quaternion[3] }}</div>
    </div> -->
    <!-- <div>
      relative acceleration:
      <div>x:{{ relativeAcceleration.x.toFixed(4) }}</div>
      <div>y:{{ relativeAcceleration.y.toFixed(4) }}</div>
      <div>z:{{ relativeAcceleration.z.toFixed(4) }}</div>
    </div> -->
    <!-- <div>
      what
      <div v-for="val in quaternionRotate">{{ val }}</div>
    </div> -->
    <!-- <div>
      angles:
      <div>x: {{ rad2deg(relativeAngles.xz).toFixed(4) }}deg</div>
      <div>y: {{ rad2deg(relativeAngles.yz).toFixed(4) }}deg</div>
    </div> -->
    <div class="monospace mb-4">
      <div>与水平面的夹角：</div>
      <div>a: {{ rad2deg(relativeHorizontalAngle).toFixed(4) }}deg</div>
      <div>a<sub>x</sub>: {{ rad2deg(relativeAngles.xz).toFixed(4) }}deg</div>
      <div>a<sub>y</sub>: {{ rad2deg(relativeAngles.yz).toFixed(4) }}deg</div>
    </div>
    <div class="monospace mb-4">
      采样率：{{ statics.sampleRate.toFixed(4) }}Hz
    </div>
    <button class="mr-4" @click="setHorizontal">将当前状态视为水平</button>
    <button @click="reset">重置水平</button>
    <!-- <div style="width: 100px; height: 100px">
      <div
        :style="{
          width: '50px',
          height: '50px',
          background: 'orange',
          transform: `rotate3d(${quaternionRotate[1]},${quaternionRotate[2]},${quaternionRotate[3]},${quaternionRotate[0]}rad)`,
        }"
      ></div>
    </div> -->
    <div class="gradienter">
      <div class="horizontal-line"></div>
      <div class="vertical-line"></div>
      <div class="center"></div>
      <div ref="bubble" class="bubble" :style="{ transform }"></div>
    </div>
  </div>
</template>
<style scoped>
.gradienter {
  margin-top: 2rem;
  width: 160px;
  height: 160px;
  border: 1px solid gray;
  border-radius: 50%;
  position: relative;
}
.bubble {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  border: 1px solid gray;
  border-radius: 50%;
  transition: all 66.66ms linear;
  transform: translate(-50%, -50%);
}
.center {
  width: 8px;
  height: 8px;
  background: orange;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.horizontal-line {
  height: 1px;
  background: gray;
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
}
.vertical-line {
  width: 1px;
  background: gray;
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
}
.mr-4 {
  margin-right: 0.5rem;
}
.mb-4 {
  margin-bottom: 0.5rem;
}
.monospace {
  font-family: "Noto Sans Mono", monospace;
}
</style>
