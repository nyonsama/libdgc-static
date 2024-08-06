import './style.css'

await new Promise<void>(resolve => document.addEventListener("DOMContentLoaded", () => resolve()))

const canvas = document.getElementById('canvas')! as HTMLCanvasElement

const resizeObserver = new ResizeObserver((entries) => {
  const entry = entries[0];
  const { blockSize, inlineSize } = entry.devicePixelContentBoxSize[0];
  canvas.width = inlineSize;
  canvas.height = blockSize;
  draw();
})
resizeObserver.observe(canvas)

const ctx = canvas.getContext("2d")!
let rafId = 0;
const draw = () => {
  cancelAnimationFrame(rafId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.font = '32px hack';
  ctx.fillText('hello', canvas.width / 2, canvas.height / 2, canvas.width);
  rafId = requestAnimationFrame(draw);
};
draw();
