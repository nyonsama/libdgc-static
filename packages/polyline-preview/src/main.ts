import "./style.css";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { glMatrix, vec2, mat2d, mat2 } from "gl-matrix";
import simplify from "simplify-js";
import { clipPolyline } from "lineclip";
import mapStyle from "./mapStyle.json";

glMatrix.setMatrixArrayType(Array);

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const TILE_SIZE = 512;

const PI_4 = Math.PI / 4;
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
  style: mapStyle as maplibregl.StyleSpecification, // "https://demotiles.maplibre.org/style.json", // style URL
  center: [0, 0], // starting position [lng, lat]
  zoom: 1, // starting zoom
});

// disable map rotation using right click + drag
map.dragRotate.disable();

// disable map rotation using keyboard
map.keyboard.disable();

// disable map rotation using touch rotation gesture
map.touchZoomRotate.disableRotation();

const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = devicePixelRatio * window.innerWidth;
canvas.height = devicePixelRatio * window.innerHeight;
canvas.style.width = `${window.innerWidth}px`;
canvas.style.height = `${window.innerHeight}px`;
document.body.appendChild(canvas);

const div = document.createElement("div");
div.id = "zoom";
document.body.appendChild(div);

const ctx = canvas.getContext("2d")!;
console.log("ctx", ctx);
// ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
//

// TODO: drawJoint
// 画平的拐角
const drawCircle = (
  x: number,
  y: number,
  radius: number,
  _ctx: CanvasRenderingContext2D = ctx,
) => {
  const ctx = _ctx;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
  // ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
};
const drawCachedCircle = (x: number, y: number) => {
  const radius = settings.lineWidth * 0.5;
  if (settings.cacheJoint) {
    ctx.drawImage(
      circleBitmapRef.value!,
      x - radius,
      y - radius,
      circle.width,
      circle.height,
    );
  } else {
    drawCircle(x, y, radius);
  }
};

const lineDrawBuffer: { x: number; y: number }[] = [];
const mat = mat2d.create();
const vec = vec2.create();
const drawSolidLine = (
  points: Array<[number, number]>,
  zoom: number,
  topLeft: vec2,
) => {
  const lineWidth = settings.lineWidth;
  const jointRadius = lineWidth * 0.5;

  // for (let index = 0; index < points.length; index++) {
  //   vec2.set(vec, points[0][0], points[0][1]);
  //   lngLatToPixel(vec, vec, zoom);
  //   const x = vec[0] - topLeft[0];
  //   const y = vec[1] - topLeft[1];

  //   const pixel = lineDrawBuffer[index];
  //   if (pixel) {
  //     pixel.x = x;
  //     pixel.y = y;
  //   } else {
  //     lineDrawBuffer[index] = { x, y };
  //   }
  // }

  // const simplified = simplify(lineDrawBuffer.slice(0, points.length), 1);
  // for (let index = 0; index < simplified.length; index++) {}

  vec2.set(vec, points[0][0], points[0][1]);
  lngLatToPixel(vec, vec, zoom);
  let startX = (vec[0] - topLeft[0]) * devicePixelRatio;
  let startY = (vec[1] - topLeft[1]) * devicePixelRatio;

  for (let index = 1; index < points.length; index++) {
    const end = points[index];

    vec2.set(vec, end[0], end[1]);
    lngLatToPixel(vec, vec, zoom);
    // 解包赋值的polyfill会使用Array.slice，需要避免
    const endX = (vec[0] - topLeft[0]) * devicePixelRatio;
    const endY = (vec[1] - topLeft[1]) * devicePixelRatio;

    const length = Math.hypot(endX - startX, endY - startY);

    if (settings.drawLine) {
      if (settings.use.glMatrix) {
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
        ctx.fillStyle = settings.color;
        ctx.fillRect(0, 0, lineWidth, length);
        ctx.resetTransform();
      } else {
        ctx.translate(startX, startY);
        ctx.rotate(Math.atan2(endY - startY, endX - startX) - Math.PI * 0.5);
        ctx.translate(-lineWidth * 0.5, 0);
        ctx.fillStyle = settings.color;
        ctx.fillRect(0, 0, lineWidth, length);
        ctx.resetTransform();
      }
    }

    // 拐角和结尾的圆角
    if (
      settings.drawJoint &&
      startX > -jointRadius &&
      startX < canvas.width + jointRadius &&
      startY > -jointRadius &&
      startY < canvas.height + jointRadius
    ) {
      ctx.fillStyle = settings.jointColor;
      drawCachedCircle(startX, startY);
    }

    startX = endX;
    startY = endY;
  }

  // 末尾的圆角
  if (settings.drawJoint) {
    ctx.fillStyle = settings.jointColor;
    drawCachedCircle(startX, startY);
  }
};

const settings = {
  lineWidth: 3 * devicePixelRatio,
  color: "green",
  // color: "rgba(0,127,0,0.2)",
  jointColor: "green",
  drawJoint: true,
  cacheJoint: false,
  imageBitmap: false, // TODO: toggle this
  jointType: "circle" as "circle" | "bevel",
  drawLine: true,
  use: {
    glMatrix: true,
    lineClip: true,
    simplify: true,
  },
  lineLength: 1000000,
};

const generateRandomPath = () => {
  // https://stackoverflow.com/a/47399787

  let ptheta = 50;
  let theta = 50;
  let x = -116.81213378906249;
  let y = 40.01499435375046;
  // let a = 0.005;
  let a = 0.1;

  const result: [number, number][] = [[x, y]];
  for (let index = 0; index < settings.lineLength; index++) {
    const rand = Math.random();
    const angleVar = (2 * rand - 1) * a * Math.PI;
    theta = ptheta + angleVar;
    let px = x;
    let py = y;
    const r = Math.random() * 0.001;
    x = px + r * Math.cos(ptheta);
    y = py + r * Math.sin(ptheta);
    ptheta = theta;
    result.push([x, y]);
  }
  return result;
};

const generateSinPath = () => {
  const { lineLength } = settings;
  return [...Array(lineLength)].map((_, index): [number, number] => {
    const offset = (100 / lineLength) * index;
    return [
      -116.81213378906249 + offset + 0.1,
      40.01499435375046 + Math.sin(offset) * 10,
    ];
  });
};

// const path = generateSinPath();
const path = generateRandomPath();

class PolylineSimplifier {
  line: [number, number][] = [];
  #cacheMap: Record<string, [number, number][]> = {};
  constructor(line: typeof this.line) {
    this.line = line;
    const zooms = [
      3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
      23,
    ];
    for (const zoom of zooms) {
      const pixels = line.map((lngLat, index) => {
        const pixel = lngLatToPixel([0, 0], lngLat, zoom);
        return { x: pixel[0], y: pixel[1], index };
      });
      const simplified = simplify(pixels, 1, false) as typeof pixels;
      this.#cacheMap[zoom] = simplified.map((point) => line[point.index]);
    }
  }
  getByZoom(zoom: number) {
    const keys = Object.keys(this.#cacheMap).map((key) => Number(key));
    const filtered = keys.filter((key) => key >= zoom);
    const ceil = filtered.length ? Math.min(...filtered) : Math.max(...keys);
    return this.#cacheMap[ceil];
  }
}

const circle = document.createElement("canvas");
const circleCtx = circle.getContext("2d");
const circleBitmapRef: { value: ImageBitmap | null } = { value: null };

{
  const w = settings.lineWidth;
  const h = settings.lineWidth;
  circle.width = w;
  circle.height = h;
  circleCtx!.clearRect(0, 0, w, h);
  circleCtx!.fillStyle = settings.jointColor;
  drawCircle(w * 0.5, h * 0.5, w * 0.5, circleCtx!);
  createImageBitmap(circle).then((bitmap) => {
    circleBitmapRef.value = bitmap;
  });
}

const simplifier = new PolylineSimplifier(path);
const render = () => {
  // div.textContent = `zoom: ${map.getZoom()}\nbounds: ${map.getBounds()}`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bounds = map.getBounds();
  const northWest = bounds.getNorthWest();
  const v = vec2.create();
  vec2.set(v, northWest.lng, northWest.lat);
  const zoom = map.getZoom();

  const drawPath = settings.use.simplify ? simplifier.getByZoom(zoom) : path;
  const topLeft = lngLatToPixel(vec2.create(), v, zoom);
  // topLeft[0] *= devicePixelRatio;
  // topLeft[1] *= devicePixelRatio;
  if (settings.use.lineClip) {
    const southEast = bounds.getSouthEast();
    const clipped = clipPolyline(drawPath, [
      northWest.lng,
      southEast.lat,
      southEast.lng,
      northWest.lat,
    ]);
    for (const segment of clipped) {
      drawSolidLine(segment, zoom, topLeft);
    }
  } else {
    drawSolidLine(drawPath, zoom, topLeft);
  }
};

map.on("load", () => {
  map.addLayer({
    id: "canvas",
    type: "custom",
    render() {
      render();
    },
  });
});

console.log(map);
