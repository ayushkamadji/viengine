import { polygonContains } from "d3-polygon"

export type Point = {
  x: number
  y: number
}

export type Polygon = Point[]

export type Line = {
  p1: Point
  p2: Point
}

export type Geometry = Polygon | Line

export const pointInPolygon = (point: Point, polygon: Polygon): boolean => {
  return polygonContains(polygonToArray(polygon), [point.x, point.y])
}

const polygonToArray = (polygon: Polygon): [number, number][] => {
  return polygon.map((p) => [p.x, p.y])
}

export const isPoint = (geometry: any): geometry is Point => {
  return typeof geometry["x"] === "number" && typeof geometry["y"] === "number"
}

export const isPolygon = (geometry: Geometry): geometry is Polygon => {
  return Array.isArray(geometry) && geometry.every((p) => isPoint(p))
}

export const isLine = (geometry: Geometry): geometry is Line => {
  return (
    typeof geometry["p1"] === "object" &&
    typeof geometry["p2"] === "object" &&
    isPoint(geometry["p1"]) &&
    isPoint(geometry["p2"])
  )
}

export const linesIntersect = (l1: Line, l2: Line): boolean => {
  const { t, u } = linesIntersectParams(l1, l2)
  if (isNaN(t)) {
    return false
  } else {
    return t >= 0 && t <= 1 && u >= 0 && u <= 1
  }
}

export const linesIntersectParams = (
  l1: Line,
  l2: Line
): { t: number; u: number } => {
  const { x: x1, y: y1 } = l1.p1
  const { x: x2, y: y2 } = l1.p2
  const { x: x3, y: y3 } = l2.p1
  const { x: x4, y: y4 } = l2.p2

  const tDenom = (x4 - x3) * (y2 - y1) - (y4 - y3) * (x2 - x1)

  if (tDenom === 0) {
    // FIXME: parallel or collinear detection
    return { t: NaN, u: NaN }
  }

  const t = ((y4 - y3) * (x1 - x3) - (x4 - x3) * (y1 - y3)) / tDenom
  const u = ((y2 - y1) * (x1 - x3) - (x2 - x1) * (y1 - y3)) / tDenom

  // const intersectionPoint = {
  //   x: x1 + t * (x2 - x1),
  //   y: y1 + t * (y2 - y1),
  // }

  return { t, u }
}

export const motionIntersectsLine = (motion: Line, line: Line): boolean => {
  const { t, u } = linesIntersectParams(motion, line)
  if (isNaN(t)) {
    return false
  } else {
    return t > 0 && t <= 1 && u >= 0 && u <= 1
  }
}

// const pointInLine = (l2: Line, point: Point): boolean => {
//   const { x: x1, y: y1 } = l2.p1
//   const { x: x2, y: y2 } = l2.p2
//   const { x: xi, y: yi } = point

//   const result = Math.abs((xi - x1) * (y2 - y1) - (yi - y1) * (x2 - x1))

//   return result < EPSILON
// }

export enum Direction {
  UP = "UP",
  RIGHT = "RIGHT",
  DOWN = "DOWN",
  LEFT = "LEFT",
}

export type VerticalDirections = Direction.UP | Direction.DOWN
export type HorizontalDirections = Direction.LEFT | Direction.RIGHT
