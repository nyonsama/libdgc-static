<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef, watch } from "vue";

const { sin, PI, sqrt, acos, cos } = Math;
const rad2deg = (rad: number) => (rad / (2 * PI)) * 360;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

class Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
  constructor(
    x: number,
    y: number,
    z: number,
    w: number,
    normalize: boolean = true,
  ) {
    if (normalize) {
      const len = sqrt(x ** 2 + y ** 2 + z ** 2 + w ** 2);
      if (len === 0) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;
      } else {
        this.x = x / len;
        this.y = y / len;
        this.z = z / len;
        this.w = w / len;
      }
    } else {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
  }
  inverse() {
    const { x, y, z, w } = this;
    return new Quaternion(-x, -y, -z, w);
  }
  length() {
    const { x, y, z, w } = this;
    return sqrt(x ** 2 + y ** 2 + z ** 2 + w ** 2);
  }
  multiply(q: Quaternion) {
    const { w: a1, x: b1, y: c1, z: d1 } = this;
    const { w: a2, x: b2, y: c2, z: d2 } = q;
    const w = a1 * a2 - b1 * b2 - c1 * c2 - d1 * d2;
    const x = a1 * b2 + b1 * a2 + c1 * d2 - d1 * c2;
    const y = a1 * c2 - b1 * d2 + c1 * a2 + d1 * b2;
    const z = a1 * d2 + b1 * c2 - c1 * b2 + d1 * a2;
    return new Quaternion(x, y, z, w);
  }
  normalize() {
    const { x, y, z, w } = this;
    const len = this.length();
    if (len === 0) {
      return new Quaternion(0, 0, 0, 1);
    } else {
      return new Quaternion(x / len, y / len, z / len, w / len);
    }
  }
  static fromAxisRadian(axis: Vector3, radian: number) {
    const { x, y, z } = axis.normalize();
    const sinHalf = sin(radian / 2);
    return new Quaternion(
      x * sinHalf,
      y * sinHalf,
      z * sinHalf,
      cos(radian / 2),
    );
  }
  toAxisRadian() {
    const { x, y, z, w } = this;
    const radian = acos(w) * 2;
    return {
      axis: new Vector3(
        x / sin(radian / 2),
        y / sin(radian / 2),
        z / sin(radian / 2),
      ),
      radian,
    };
  }
}

class Vector3 {
  x: number;
  y: number;
  z: number;
  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  setX(x: number) {
    return new Vector3(x, this.y, this.z);
  }
  setY(y: number) {
    return new Vector3(this.x, y, this.z);
  }
  setZ(z: number) {
    return new Vector3(this.x, this.y, z);
  }
  lengthSquare() {
    const { x, y, z } = this;
    return x ** 2 + y ** 2 + z ** 2;
  }
  length() {
    return sqrt(this.lengthSquare());
  }
  sub(v: Vector3) {
    const { x, y, z } = this;
    return new Vector3(x - v.x, y - v.y, z - v.z);
  }
  multiplyScalar(scalar: number) {
    const { x, y, z } = this;
    return new Vector3(x * scalar, y * scalar, z * scalar);
  }
  normalize() {
    const len = this.length();
    if (len === 0) {
      return new Vector3(0, 0, 0);
    } else {
      return this.multiplyScalar(1 / len);
    }
  }
  dot(v: Vector3) {
    const { x, y, z } = this;
    return x * v.x + y * v.y + z * v.z;
  }
  angleTo(v: Vector3) {
    const denominator = this.length() * v.length();
    if (denominator === 0) {
      return PI / 2;
    } else {
      return acos(clamp(this.dot(v) / denominator, -1, 1));
    }
  }
  // 外积
  crossProduct(v: Vector3) {
    const { x: u1, y: u2, z: u3 } = this;
    const { x: v1, y: v2, z: v3 } = v;
    return new Vector3(
      u2 * v3 - u3 * v2, // u2v3 - u3v2
      -(u1 * v3 - u3 * v1), // -(u1v3 - u3v1)
      u1 * v2 - u2 * v1, // u1v2 - u2v1
    );
  }
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  // 用四元数旋转一个向量
  rotateQuaternion(q: Quaternion) {
    const { x, y, z } = this;
    const product = q
      .multiply(new Quaternion(x, y, z, 0))
      .multiply(q.inverse());
    return new Vector3(product.x, product.y, product.z);
  }
}

const api = ref<"GravitySensor" | "DeviceMotion">("GravitySensor");

// 定义两个坐标系：设备坐标系、偏移坐标系
// 初始状态下，两个坐标系是重合的
// 点击“将当前状态视为水平”后，将偏移坐标系z轴旋转到和此时的加速度重合

// 从传感器拿到的三个轴上的加速度（相对于设备的加速度）
const acceleration = ref(new Vector3(0, 0, 0));
// 水平状态的加速度（已经归一化）
const initialAccelerationNormalized = new Vector3(0, 0, 1);
// 与偏移坐标系z轴重合的加速度（相对于设备坐标系）（已经归一化）
const baseAccelerationNormalized = ref(initialAccelerationNormalized.clone());

// 将设备坐标系旋转到偏移坐标系的四元数
const offsetQuaternion = computed(() => {
  const base = baseAccelerationNormalized.value;
  return Quaternion.fromAxisRadian(
    base.crossProduct(initialAccelerationNormalized),
    base.angleTo(initialAccelerationNormalized),
  );
});

// 偏移坐标系上的加速度（已经归一化）
const rotatedAccelerationNormalized = computed(() => {
  return acceleration.value.rotateQuaternion(offsetQuaternion.value);
});

// 把加速度旋转到偏移坐标系z轴的四元数
const orientationQuaternion = computed(() => {
  const rotated = rotatedAccelerationNormalized.value;
  // const base = normalizedBaseAcceleration.value;
  return Quaternion.fromAxisRadian(
    rotated.crossProduct(initialAccelerationNormalized),
    rotated.angleTo(initialAccelerationNormalized),
  );
});

// 加速度与偏移坐标系各个坐标轴的角度
const rotatedAngles = computed(() => {
  const { x, y, z } = rotatedAccelerationNormalized.value;
  return { x: acos(x), y: acos(y), z: acos(z) };
});

const transform = computed(() => {
  const { x, y } = rotatedAccelerationNormalized.value.normalize();
  const { axis, radian } = orientationQuaternion.value.toAxisRadian();
  const radius = 80;

  const translateX = x * radius;
  const translateY = -y * radius;
  return `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) rotate3D(${
    axis.x
  }, ${-axis.y}, ${axis.z}, ${radian}rad) `;
});

// 将偏移坐标系移动到与此刻的加速度重合
const setHorizontal = () => {
  baseAccelerationNormalized.value = acceleration.value.normalize();
};

// 将偏移坐标系重置到初始状态
const reset = () => {
  baseAccelerationNormalized.value = new Vector3(0, 0, 1);
};

// 算采样率
const sampleRate = ref(0);
let sampleCount = 0;
let lastSampleRateTime = 0;
const intervalId = setInterval(() => {
  const now = performance.now();
  if (lastSampleRateTime === 0) {
    sampleRate.value = 0;
  } else {
    sampleRate.value = sampleCount / ((now - lastSampleRateTime) / 1000);
  }
  lastSampleRateTime = now;
  sampleCount = 0;
}, 1000);

const hasDeviceMotion = ref(typeof DeviceMotionEvent !== "undefined");
const hasGravitySensor = ref(typeof GravitySensor !== "undefined");
const hasSensorPermission = ref(false);
const hasDeviceMotionPermission = ref(
  hasDeviceMotion.value && !Reflect.has(DeviceMotionEvent, "requestPermission"),
);

const gravityRef = shallowRef<GravitySensor | null>(null);

watch(
  [api],
  async () => {
    if (api.value === "DeviceMotion") {
      if (hasDeviceMotionPermission.value === false) {
        try {
          // @ts-ignore
          const resp = await DeviceMotionEvent.requestPermission();
          if (resp === "granted") {
            hasDeviceMotionPermission.value = true;
          } else {
            return;
          }
        } catch (error) {
          console.log(error);
          return;
        }
      }

      gravityRef.value?.stop();
      window.ondevicemotion = (event) => {
        sampleCount += 1;
        const { x, y, z } = event.accelerationIncludingGravity ?? {};
        acceleration.value = new Vector3(x ?? 0, y ?? 0, z ?? 0);
      };
    } else if (api.value === "GravitySensor") {
      if (!hasGravitySensor.value) {
        return;
      }
      window.ondevicemotion = null;
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "accelerometer" as unknown as PermissionName,
        });
        if (permissionStatus.state !== "granted") {
          return;
        }
      } catch (error) {
        console.log(error);
        return;
      }
      hasSensorPermission.value = true;
      const gravity = new GravitySensor({ frequency: 1000 });
      gravityRef.value = gravity;
      gravity.addEventListener("reading", () => {
        sampleCount += 1;
        const { x = 0, y = 0, z = 0 } = gravity;
        acceleration.value = new Vector3(x, y, z);
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
  <div v-else-if="api == 'DeviceMotion' && !hasDeviceMotionPermission">
    没有使用DeviceMotion的权限
  </div>
  <div v-else-if="api === 'GravitySensor' && !hasGravitySensor">
    你的浏览器不支持GravitySensor
  </div>
  <div v-else-if="api === 'GravitySensor' && !hasSensorPermission">
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
    <div class="monospace mb-4">
      <div>加速度与各坐标轴的夹角：</div>
      <div>x: {{ rad2deg(rotatedAngles.x).toFixed(4) }}deg</div>
      <div>y: {{ rad2deg(rotatedAngles.y).toFixed(4) }}deg</div>
      <div>z: {{ rad2deg(rotatedAngles.z).toFixed(4) }}deg</div>
    </div>
    <div class="monospace mb-4">采样率：{{ sampleRate.toFixed(4) }}Hz</div>
    <button class="mr-4" @click="setHorizontal">将当前状态视为水平</button>
    <button @click="reset">重置水平</button>
    <div class="gradienter">
      <div class="horizontal-line"></div>
      <div class="vertical-line"></div>
      <div class="center"></div>
      <div class="bubble" :style="{ transform }"></div>
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
