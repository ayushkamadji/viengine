import { Geometry } from "../../../lib/util/geometry"
import { Command, CommandContext } from "../../context/command-decorator"
import {
  AbstractCommandContext,
  Context,
  emptyContext,
} from "../../context/context.interface"
import { ElementFunction } from "../../ecs-systems/renderer-element"
import { EditorService } from "../../editor-service"
import type { StemElement } from "../../vieditor-element"
import { GizmoManager, HIGHLIGHT_COLOR } from "../text-box-factory"

const MOVE_GIZMO_OFFSET = 15

@CommandContext({
  keybinds: [
    ["h", "moveLeft"],
    ["j", "moveDown"],
    ["k", "moveUp"],
    ["l", "moveRight"],
    ["Escape", "exit"],
  ],
})
export class MoveContext extends AbstractCommandContext {
  private _exitContext: Context
  constructor(
    private readonly editorService: EditorService,
    private readonly element: StemElement,
    private readonly gizmoManager: GizmoManager,
    readonly name: string
  ) {
    super()
    this._exitContext = emptyContext
  }

  @Command("moveLeft")
  private moveLeft() {
    this.editorService.moveElement(this.element, -0.25, 0)
    this.gizmoManager.update()
  }

  @Command("moveDown")
  private moveDown() {
    this.editorService.moveElement(this.element, 0, 0.25)
    this.gizmoManager.update()
  }

  @Command("moveUp")
  private moveUp() {
    this.editorService.moveElement(this.element, 0, -0.25)
    this.gizmoManager.update()
  }

  @Command("moveRight")
  private moveRight() {
    this.editorService.moveElement(this.element, 0.25, 0)
    this.gizmoManager.update()
  }

  // TODO: Navigational commands should be abstracted to abstract class
  @Command("exit")
  private exit() {
    this.editorService.navigateTo(this._exitContext)
  }

  setExitContext(context: Context) {
    this._exitContext = context
  }

  onEntry() {
    this.gizmoManager.addOrReplace(MoveGizmo)
  }

  onExit() {}
}

export const MoveGizmo: ElementFunction = ({
  points,
  x,
  y,
}: {
  points: Geometry
  x: number
  y: number
}) => {
  const pointArray = Array.isArray(points) ? points : [points.p1, points.p2]
  const minPolyX = Math.min(...pointArray.map((p) => p.x)) - x
  const maxPolyX = Math.max(...pointArray.map((p) => p.x)) - x
  const minPolyY = Math.min(...pointArray.map((p) => p.y)) - y
  const maxPolyY = Math.max(...pointArray.map((p) => p.y)) - y

  const northPos = {
    x: (minPolyX + maxPolyX) / 2,
    y: minPolyY - MOVE_GIZMO_OFFSET,
  }

  const southPos = {
    x: (minPolyX + maxPolyX) / 2,
    y: maxPolyY + MOVE_GIZMO_OFFSET,
  }

  const eastPos = {
    x: maxPolyX + MOVE_GIZMO_OFFSET,
    y: (minPolyY + maxPolyY) / 2,
  }

  const westPos = {
    x: minPolyX - MOVE_GIZMO_OFFSET,
    y: (minPolyY + maxPolyY) / 2,
  }

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <polygon
          points="0,0 -10,10 10,10"
          id="triangle-icon"
          fill={HIGHLIGHT_COLOR}
          orient="auto"
        />
      </defs>
      <use
        href="#triangle-icon"
        transform={`translate(${northPos.x}, ${northPos.y})`}
      />
      <use
        href="#triangle-icon"
        transform={`translate(${southPos.x}, ${southPos.y}) rotate(180)`}
      />
      <use
        href="#triangle-icon"
        transform={`translate(${eastPos.x}, ${eastPos.y}) rotate(90)`}
      />
      <use
        href="#triangle-icon"
        transform={`translate(${westPos.x}, ${westPos.y}) rotate(270)`}
      />
    </g>
  )
}
