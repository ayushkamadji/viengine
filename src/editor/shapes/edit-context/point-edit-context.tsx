import { Point } from "../../../lib/util/geometry"
import { Command, CommandContext } from "../../context/command-decorator"
import {
  AbstractCommandContext,
  Context,
  emptyContext,
} from "../../context/context.interface"
import { ElementFunction } from "../../ecs-systems/renderer-element"
import { EditorService } from "../../editor-service"
import { StemElement } from "../../vieditor-element"
import { GizmoManager, GizmoProps } from "../gizmo-manager"
import { HIGHLIGHT_COLOR } from "../text-box-factory"

export interface PointEditContext extends Context {
  movePoint(deltaX: number, deltaY: number): void
  setExitContext(context: Context): void
}

export interface PointEditContextFactory<T extends StemElement> {
  create(
    editorService: EditorService,
    element: T,
    gizmoManager: GizmoManager,
    parentName: string,
    index: number
  ): PointEditContext
}

export type MoveHandler<T> = (
  element: T,
  deltaX: number,
  deltaY: number
) => void

@CommandContext({
  keybinds: [
    ["k", "next"],
    ["l", "next"],
    ["j", "prev"],
    ["h", "prev"],
    ["Enter", "select"],
    ["Escape", "exit"],
  ],
})
export class PointEditSelectContext<
  T extends StemElement
> extends AbstractCommandContext {
  private _exitContext: Context = emptyContext
  private readonly points: Point[]
  private readonly pointEditContexts: PointEditContext[]
  private selectedPointIndex: number

  constructor(
    private readonly editorService: EditorService,
    private readonly element: T,
    private readonly gizmoManager: GizmoManager,
    readonly name: string,
    pointEditContextFactory: PointEditContextFactory<T>
  ) {
    super()
    const geometry = this.element.geometryFn()

    this.points = Array.isArray(geometry)
      ? geometry
      : [geometry.p1, geometry.p2]

    this.selectedPointIndex = 0

    this.pointEditContexts = []
    for (let i = 1; i <= this.points.length; i++) {
      const pointEditContext = pointEditContextFactory.create(
        editorService,
        element,
        gizmoManager,
        name,
        i
      )
      pointEditContext.setExitContext(this)
      this.editorService.registerContext(
        pointEditContext.name,
        pointEditContext
      )
      this.pointEditContexts.push(pointEditContext)
    }
  }

  @Command("next")
  private next() {
    this.selectedPointIndex = (this.selectedPointIndex + 1) % this.points.length
    this.gizmoManager.update({ selectedIndex: this.selectedPointIndex })
  }

  @Command("prev")
  private prev() {
    this.selectedPointIndex =
      (this.selectedPointIndex + this.points.length - 1) % this.points.length
    this.gizmoManager.update({ selectedIndex: this.selectedPointIndex })
  }

  @Command("select")
  private select() {
    const pointEditContext = this.pointEditContexts[this.selectedPointIndex]
    this.editorService.navigateTo(pointEditContext)
  }

  @Command("exit")
  private exit() {
    this.editorService.navigateTo(this._exitContext)
  }

  onEntry(): void {
    this.gizmoManager.addOrReplace(PointsGizmo, {
      selectedIndex: this.selectedPointIndex,
    })
  }

  setExitContext(context: Context) {
    this._exitContext = context
  }
}

export const SELECTED_COLOR = "#ff00ff"

type PointsGizmoProps = GizmoProps & { selectedIndex: number }

export const PointsGizmo: ElementFunction = ({
  points,
  selectedIndex,
}: PointsGizmoProps) => {
  const pointArray = Array.isArray(points) ? points : [points.p1, points.p2]
  return (
    <g>
      {pointArray.map((point, index) => {
        return (
          <PointGizmo
            key={`point-gizmo-${index}`}
            x={point.x}
            y={point.y}
            fill={index === selectedIndex ? SELECTED_COLOR : HIGHLIGHT_COLOR}
          />
        )
      })}
    </g>
  )
}

export const PointGizmo: ElementFunction = ({
  x,
  y,
  points,
  ...rest
}: GizmoProps) => {
  return (
    <rect
      x={x - 4}
      y={y - 4}
      width={8}
      height={8}
      fill={SELECTED_COLOR}
      {...rest}
    />
  )
}
