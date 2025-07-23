import "./style.css";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { glMatrix, vec2, mat2d, mat2 } from "gl-matrix";

glMatrix.setMatrixArrayType(Array);

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
// const degToRad = (degree: number) => {
//   return degree * DEG_TO_RAD;
// };
const TILE_SIZE = 512;

const PI_4 = Math.PI / 4;
const PI_2 = Math.PI / 2;
const PI_2_REV = 1 / (Math.PI * 2);
const lngLatToPixel = (out: vec2, lngLat: vec2, zoom: number) => {
  const lng = lngLat[0] * DEG_TO_RAD;
  const lat = lngLat[1] * DEG_TO_RAD;
  const { PI, log, tan } = Math;
  // 抄这个公式 https://en.wikipedia.org/wiki/Web_Mercator_projection
  const x = PI_2_REV * 2 ** zoom * (PI + lng);
  const y = PI_2_REV * 2 ** zoom * (PI - log(tan(PI_4 + lat * 0.5)));
  return vec2.set(out, x * TILE_SIZE, y * TILE_SIZE);
};

const map = new maplibregl.Map({
  container: "app", // container id
  style: "https://demotiles.maplibre.org/style.json", // style URL
  center: [0, 0], // starting position [lng, lat]
  zoom: 1, // starting zoom
});

const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = devicePixelRatio * window.innerWidth;
canvas.height = devicePixelRatio * window.innerHeight;
document.body.appendChild(canvas);

const div = document.createElement("div");
div.id = "zoom";
document.body.appendChild(div);

// const lngLatToPixel = (lngLat: vec2) => {
//   const zoom = map.getZoom();
//   // 缩放倍数为1时，全世界宽1024px/360纬度，高1024px/170经度（南北纬85以外的被去掉了）
//   // 缩放倍数每+1，宽高x2
//   const lng = lngLat[0];
//   const lat = lngLat[1];
//   const scale = 512 * 2 ** zoom;
//   const x = (lng / 360) * scale;
//   const y = (-(lat - 85) / 170) * scale;
//   return vec2.set(lngLat, x, y);
// };

// const lngLatToCanvas = ([lng,lat]:[number,number])=>{
//   const zoom = map.getZoom();
//    // 缩放倍数为1时，全世界宽1024px/360纬度，高1024px/170经度（南北纬85以外的被去掉了）
//    // 缩放倍数每+1，宽高x2
//    const lng = lngLat[0];
//    const lat = lngLat[1];
//    const scale = 512 * 2 ** zoom;
//    const x = (lng / 360) * scale;
//    const y = (-(lat - 85) / 170) * scale;
//    return vec2.set(lngLat, x, y)
// }
const getLngLatToCanvasMatrix = () => {
  const vec = vec2.create();
  const mat = mat2d.create();
  const northWest = map.getBounds().getNorthWest();
  // mat2d.translate(mat, mat, vec2.set(vec, -northWest.lng, -northWest.lat - 85));
  const zoom = map.getZoom();
  const scale = 512 * 2 ** zoom;

  const toPixel = mat2d.create();
  mat2d.scale(
    toPixel,
    toPixel,
    vec2.set(vec, (1 / 360) * scale, -(1 / 170) * scale),
  );
  mat2d.translate(toPixel, toPixel, vec2.set(vec, 0, -85));
  // return toPixel;
  vec2.set(vec, northWest.lng, northWest.lat);
  vec2.transformMat2d(vec, vec, toPixel);
  const leftTopX = vec[0];
  const leftTopY = vec[1];
  // mat2d.copy(mat, toPixel);
  mat2d.translate(mat, mat, vec2.set(vec, -leftTopX, -leftTopY));
  // mat2d.mul(mat, toPixel, mat);
  mat2d.mul(mat, mat, toPixel);
  return mat;

  // mat2d.translate(mat, mat, vec2.set(vec, northWest.lng, -northWest.lat - 85));
  // mat2d.scale(mat, mat, vec2.set(vec, (1 / 360) * scale, -(1 / 170) * scale));
  // -((lat - 85) - (northWest.lat - 85))
  // -(lat-85-nw.lat+85)
  // mat2d.translate(mat, mat, vec2.set(vec, -northWest.lng, -85));
  // mat2d.translate(mat, mat, vec2.set(vec, -northWest.lng, -northWest.lat));
  //
  // vec2.set(vec, northWest.lng, northWest.lat);
  // vec2.transformMat2d(vec, vec, mat);
  // const leftTopX = vec[0];
  // const leftTopY = vec[1];
  // mat2d.translate(mat, mat, vec2.set(vec, -leftTopX, -leftTopY));
  return mat;
};

const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "rgba(0, 255, 0, 0.2)";

const drawCircle = (x: number, y: number, radius: number) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  // ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();
};

const mat = mat2d.create();
const vec = vec2.create();
const drawSolidLine = (
  points: Array<[number, number]>,
  zoom: number,
  topLeft: vec2,
) => {
  const bounds = map.getBounds();
  const southEast = bounds.getSouthEast();
  const bottomRight = vec2.clone(lngLatToPixel(vec, vec, zoom));
  // mat2d.copy(mat, transform);
  // ctx.fillStyle = "#54C0609f";
  // ctx.fillStyle = "#54C060";
  // ctx.fillStyle = "red";
  ctx.fillStyle = "green";
  const lineWidth = 3 * devicePixelRatio;

  vec2.set(vec, points[0][0], points[0][1]);
  lngLatToPixel(vec, vec, zoom);
  let startX = vec[0] - topLeft[0];
  let startY = vec[1] - topLeft[1];

  // 开头的圆角
  // ctx.resetTransform();
  ctx.beginPath();
  ctx.arc(startX, startY, lineWidth * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();

  for (let index = 1; index < points.length; index++) {
    // ctx.resetTransform();
    const end = points[index];

    vec2.set(vec, end[0], end[1]);
    lngLatToPixel(vec, vec, zoom);
    // vec2.transformMat2d(vec, vec, mat);
    // 解包赋值的polyfill会使用Array.slice，需要避免
    const endX = vec[0] - topLeft[0];
    const endY = vec[1] - topLeft[1];

    // 拐角和结尾的圆角 TODO: padding
    if (endX > 0 && endX < canvas.width && endY > 0 && endY < canvas.height) {
      drawCircle(endX, endY, lineWidth * 0.5);
      // TODO: circle有问题，好像会多出来一点点
    }

    const length = Math.hypot(endX - startX, endY - startY);

    mat2d.fromTranslation(mat, vec2.set(vec, startX, startY));
    mat2d.rotate(
      mat,
      mat,
      Math.atan2(endY - startY, endX - startX) - Math.PI * 0.5,
    );
    mat2d.translate(mat, mat, vec2.set(vec, -lineWidth * 0.5, 0));
    {
      const m = mat;
      ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    }
    vec2.transformMat2d(vec, vec, mat);
    ctx.fillRect(0, 0, lineWidth, length);
    ctx.resetTransform();

    // ctx.translate(startX, startY);
    // ctx.rotate(Math.atan2(endY - startY, endX - startX) - Math.PI * 0.5);
    // ctx.translate(-lineWidth * 0.5, 0);
    // ctx.fillRect(0, 0, lineWidth, length);
    // ctx.resetTransform();

    startX = endX;
    startY = endY;
  }
};

const path = [...Array(10000)].map((_, index): [number, number] => {
  const offset = 0.01 * index;
  return [
    -116.81213378906249 + offset + 0.1,
    40.01499435375046 + Math.sin(offset) * 10,
  ];
});

const render = () => {
  // div.textContent = `zoom: ${map.getZoom()}\nbounds: ${map.getBounds()}`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // const point = map.project([-27, -17]);
  // ctx.fillRect(point.x, point.y, 100, 100);
  // drawSolidLine(path, getLngLatToCanvasMatrix());
  const northWest = map.getBounds().getNorthWest();
  const v = vec2.create();
  vec2.set(v, northWest.lng, northWest.lat);
  const zoom = map.getZoom();
  drawSolidLine(path, zoom, lngLatToPixel(v, v, zoom));
};

map.on("load", () => {
  map.addLayer({
    id: "canvas",
    type: "custom",
    render() {
      render();
    },
  });
  setTimeout(() => {
    // console.log(
    //   path.map((point) => {
    //     return lngLatToPixel(vec2.fromValues(point[0], point[1]));
    //   }),
    // );
    console.log(
      path.map((point) => {
        const vec = vec2.fromValues(point[0], point[1]);
        return vec2.transformMat2d(vec, vec, getLngLatToCanvasMatrix());
      }),
    );
  }, 1000);
});
Object.assign(window, {
  getLngLatToCanvasMatrix,
  lngLatToPixel,
  transformWithToCanvasMatrix([x, y]: [number, number]) {
    const mat = getLngLatToCanvasMatrix();
    const vec = vec2.fromValues(x, y);
    return vec2.transformMat2d(vec, vec, mat);
  },
});

console.log(map);
