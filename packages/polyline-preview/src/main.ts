import "./style.css";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";

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

const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
const render = () => {
  div.textContent = `zoom: ${map.getZoom()}\nbounds: ${map.getBounds()}`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(100, 100, 100, 100);
  requestAnimationFrame(render);
};

requestAnimationFrame(render);

console.log(map);
