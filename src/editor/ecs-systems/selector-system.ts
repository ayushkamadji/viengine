import {
  ComponentClass,
  Entity,
  EntityManager,
  ManagedSystem,
} from "../ecs/entity-component-system"
import {
  Direction,
  Geometry,
  isLine,
  isPolygon,
  Line,
  linesIntersectParams,
  pointInPolygon,
  Polygon,
} from "../../lib/util/geometry"
import { EditorLayer, Util } from "../editor"
import { Point } from "../vieditor-element"

type DirectionKey = keyof typeof Direction

export type HighlightParams = {
  exitPositions: {
    [key in DirectionKey]: { col: number; row: number }
  }
}

const defaultHighlightParams: HighlightParams = {
  exitPositions: {
    UP: { col: 0, row: 0 },
    DOWN: { col: 0, row: 0 },
    LEFT: { col: 0, row: 0 },
    RIGHT: { col: 0, row: 0 },
  },
}

type HighlightCallback = (
  entity: Entity,
  selectionParams: HighlightParams
) => void

export class SelectorComponent {
  constructor(private readonly geometryFn: () => Geometry) {}

  get geometry() {
    return this.geometryFn()
  }
}

export class SelectorSystem implements ManagedSystem {
  protected requiredComponents: ComponentClass[] = [SelectorComponent]
  private highlightCallback: HighlightCallback = () => {}

  constructor(private entityManager: EntityManager) {}

  update(cursorMotion: Line): void {
    const entities = this.entityManager.getEntitiesWithComponents(
      this.requiredComponents
    )

    for (const entity of entities) {
      const container = this.entityManager.getEntityComponentContainer(entity)
      const selector: SelectorComponent = container.get(SelectorComponent)
      let collides = false
      const params: HighlightParams = defaultHighlightParams

      if (isPolygon(selector.geometry)) {
        collides = pointInPolygon(cursorMotion.p2, selector.geometry)
        params.exitPositions = exitPositionsFromPolygon(
          cursorMotion.p2,
          selector.geometry
        )
      } else if (isLine(selector.geometry)) {
        collides = motionIntersectsLine(cursorMotion, selector.geometry)
        params.exitPositions = exitPositionsFromLine(cursorMotion)
      }

      if (collides) {
        this.highlightCallback(entity, params)
        break
      }
    }
  }

  setHighlightCallback(callback: HighlightCallback) {
    this.highlightCallback = callback
  }
}

/* FIXME: Currently we are using the bounding box for the polygon by
 * looking for max X and max Y. This will be jumpy if the GRID GAP is much
 * smaller than the polygon. We should use the actual polygon to determine
 * the exit point. (Currently I don't know what algorithm to use for this)
 */
function exitPositionsFromPolygon(
  cursor: Point,
  polygon: Polygon
): HighlightParams["exitPositions"] {
  const minPolyX = Math.min(...polygon.map((p) => p.x))
  const maxPolyX = Math.max(...polygon.map((p) => p.x))
  const minPolyY = Math.min(...polygon.map((p) => p.y))
  const maxPolyY = Math.max(...polygon.map((p) => p.y))
  const cursorColRow = Util.cursorCanvasXYToColRow(cursor.x, cursor.y)

  /*  o------------> +X
   *  |
   *  |
   *  v
   *  +Y
   */
  const rowUp =
    Math.ceil((minPolyY - EditorLayer.GRID_GAP) / EditorLayer.GRID_GAP) - 1
  const colRight =
    Math.floor((maxPolyX + EditorLayer.GRID_GAP) / EditorLayer.GRID_GAP) - 1
  const rowDown =
    Math.floor((maxPolyY + EditorLayer.GRID_GAP) / EditorLayer.GRID_GAP) - 1
  const colLeft =
    Math.ceil((minPolyX - EditorLayer.GRID_GAP) / EditorLayer.GRID_GAP) - 1

  return {
    UP: { col: cursorColRow.col, row: rowUp },
    RIGHT: { col: colRight, row: cursorColRow.row },
    DOWN: { col: cursorColRow.col, row: rowDown },
    LEFT: { col: colLeft, row: cursorColRow.row },
  }
}

function motionLineDirection(line: Line): Direction {
  const { x: x1, y: y1 } = line.p1
  const { x: x2, y: y2 } = line.p2

  if (x1 === x2) {
    return y1 < y2 ? Direction.DOWN : Direction.UP
  } else {
    return x1 < x2 ? Direction.RIGHT : Direction.LEFT
  }
}

/* FIXME: Currently when the intersection point coincides with
 * intersection point, it will pop the cursor out at the
 * which needs to change to popping up the cursor at the
 * curent position + direction.
 * Check needs to be added for cursor<>intersection coinciding
 * and behavior modified. See comment pseudo code below.
 */
function exitPositionsFromLine(
  cursorMotion: Line
  // intersectionPoint: Point
): HighlightParams["exitPositions"] {
  const motionDirection = motionLineDirection(cursorMotion)
  const { col, row } = Util.cursorCanvasXYToColRow(
    cursorMotion.p2.x,
    cursorMotion.p2.y
  )

  const exitPositions = {
    UP: { col, row: row - 1 },
    DOWN: { col, row: row + 1 },
    LEFT: { col: col - 1, row },
    RIGHT: { col: col + 1, row },
  }

  // if (intersectionPoint === cursorMotion.p2) { [motionDir]: col or row +1 or -1 }

  return { ...exitPositions, [motionDirection]: { col, row } }
}

function motionIntersectsLine(cursorMotion: Line, line: Line): boolean {
  const { t, u } = linesIntersectParams(cursorMotion, line)
  if (isNaN(t)) {
    return false
  } else {
    return t > 0 && t <= 1 && u >= 0 && u <= 1
  }
}
