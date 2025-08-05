/// <reference types="vite/client" />

declare module "lineclip" {
  type Point = [number, number];

  type BoundingBox = [number, number, number, number];

  type LineClipResult = Point[];
  export function clipPolyline(
    points: Point[],
    bbox: BoundingBox,
    result?: LineClipResult[],
  ): LineClipResult[];
}
