import { Command, CommandContext } from "../context/command-decorator"
import {
  AbstractCommandContext,
  Context,
  emptyContext,
} from "../context/context.interface"
import { ElementFunction } from "../ecs-systems/renderer-element"
import { EditorService } from "../editor-service"
import { Point, StemElement } from "../vieditor-element"
import { MoveContext } from "./edit-context/move-context"
import { ShapeFactory } from "./shape-factory"
import { EditHighlightGizmo } from "./edit-highlight-gizmo"
import { GizmoManager } from "./gizmo-manager"
import {
  MoveHandler,
  PointEditContext,
  PointEditContextFactory,
  PointEditSelectContext,
  PointGizmo,
} from "./edit-context/point-edit-context"
import { SIZING_STEP } from "./text-box-factory"

export const Line: ElementFunction = ({ gProps, lineProps }) => {
  return (
    <g {...gProps}>
      <defs>
        <marker
          id="end-arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="0"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0,0 10,3.5 0,7" fill={lineProps.stroke} />
        </marker>
        <marker
          id="start-arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="0"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="10,0 10,7 0,3.5" fill={lineProps.stroke} />
        </marker>
      </defs>
      <line {...lineProps}></line>
    </g>
  )
}

type LineProps = {
  x1: number
  y1: number
  x2: number
  y2: number
  "stroke-width": number
  stroke: string
  "marker-end"?: string
  "marker-start"?: string
}

export class LineNode implements StemElement {
  static _jsxElementFunction = Line

  name: string
  props: { gProps: any; lineProps: LineProps } = {
    gProps: {
      transform: "translate(0, 0)",
    },
    lineProps: {
      x1: 0,
      y1: 0,
      x2: 120,
      y2: 80,
      "stroke-width": 2,
      stroke: "white",
      "marker-end": "url(#end-arrowhead)",
    },
  }
  position: Point = { x: 0, y: 0 }

  constructor(public entityID: number) {
    this.name = "line-node"
  }

  get jsxElementFunction() {
    return LineNode._jsxElementFunction
  }

  geometryFn = () => {
    const { x1, y1, x2, y2 } = this.props.lineProps
    const p1 = { x: x1 + this.position.x, y: y1 + this.position.y }
    const p2 = { x: x2 + this.position.x, y: y2 + this.position.y }

    return { p1, p2 }
  }

  setPosition(x: number, y: number): void {
    this.props.gProps.transform = `translate(${x}, ${y})`
    this.position = { x, y }
  }
}

export class LineNodeFactory implements ShapeFactory {
  editorElement = LineNode
  name = "line-node-factory"

  constructor(private readonly editorService: EditorService) {}

  create(): void {
    const entity = this.editorService.generateEntity()
    const docElement = new this.editorElement(entity)

    this.editorService.addElementAtCursor(docElement)

    this.registerContexts(docElement)
    this.editorService.navigateTo(`root/document/${entity}/edit/points/2`)
  }

  load(docElement: LineNode) {
    const entity = this.editorService.generateEntity()
    docElement.entityID = entity

    this.editorService.addElement(docElement)

    this.registerContexts(docElement)
    this.editorService.navigateTo("root")
  }

  private registerContexts(docElement: LineNode) {
    const entity = docElement.entityID
    const editContext = new LineEditContext(
      this.editorService,
      docElement,
      `root/document/${entity}/edit`
    )
    this.editorService.registerContext(editContext.name, editContext)
  }
}

type LineMoveHandler = MoveHandler<LineNode>
export class LinePointEditContextFactory
  implements PointEditContextFactory<LineNode>
{
  private readonly moveHandlers: LineMoveHandler[] = [
    this.handleMoveP1,
    this.handleMoveP2,
  ]
  create(
    editorService: EditorService,
    element: LineNode,
    gizmoManager: GizmoManager,
    parentName: string,
    index: number
  ): PointEditContext {
    return new LinePointEditContext(
      editorService,
      element,
      gizmoManager,
      `${parentName}/${index}`,
      this.moveHandlers[index - 1],
      index - 1
    )
  }

  private handleMoveP1(element: LineNode, deltaX: number, deltaY) {
    const position = element.position
    element.setPosition(position.x + deltaX, position.y + deltaY)
    element.props.lineProps.x2 -= deltaX
    element.props.lineProps.y2 -= deltaY
  }

  private handleMoveP2(element: LineNode, deltaX: number, deltaY) {
    element.props.lineProps.x2 += deltaX
    element.props.lineProps.y2 += deltaY
  }
}

@CommandContext({
  keybinds: [
    ["h", "moveLeft"],
    ["l", "moveRight"],
    ["k", "moveUp"],
    ["j", "moveDown"],
    ["Escape", "exit"],
  ],
})
export class LinePointEditContext
  extends AbstractCommandContext
  implements PointEditContext
{
  private _exitContext: Context = emptyContext

  constructor(
    private readonly editorService: EditorService,
    private readonly element: LineNode,
    private readonly gizmoManager: GizmoManager,
    public name: string,
    private readonly onMove: LineMoveHandler,
    private readonly pointIndex: number
  ) {
    super()
  }

  @Command("moveLeft")
  private moveLeft(): void {
    this.movePoint(-SIZING_STEP, 0)
  }

  @Command("moveRight")
  private moveRight(): void {
    this.movePoint(SIZING_STEP, 0)
  }

  @Command("moveUp")
  private moveUp(): void {
    this.movePoint(0, -SIZING_STEP)
  }

  @Command("moveDown")
  private moveDown(): void {
    this.movePoint(0, SIZING_STEP)
  }

  setExitContext(context: Context): void {
    this._exitContext = context
  }

  movePoint(deltaX: number, deltaY: number): void {
    this.onMove(this.element, deltaX, deltaY)
    this.editorService.setElementCanvasProps(
      this.element.entityID,
      this.element.props
    )
    this.updateGizmo()
  }

  private updateGizmo(): void {
    const currentPosition = this.currentPosition()
    this.gizmoManager.update({
      x: currentPosition.x,
      y: currentPosition.y,
    })
  }

  onEntry(): void {
    const currentPosition = this.currentPosition()
    this.gizmoManager.addOrReplace(PointGizmo, {
      x: currentPosition.x,
      y: currentPosition.y,
    })
  }

  private currentPosition(): Point {
    const { p1, p2 } = this.element.geometryFn()
    return [p1, p2][this.pointIndex]
  }

  @Command("exit")
  private exit(): void {
    this.editorService.navigateTo(this._exitContext)
  }
}

@CommandContext({
  keybinds: [
    ["m", "move"],
    ["p", "pointEdit"],
    ["e", "toggleEndMarker"],
    ["s", "toggleStartMarker"],
    ["Escape", "exit"],
  ],
})
export class LineEditContext extends AbstractCommandContext {
  static MOVE_STEP = 10
  static linePointEditContextFactory = new LinePointEditContextFactory()
  private readonly moveContext: MoveContext
  private readonly gizmoManager: GizmoManager
  private readonly pointEditSelectContext: PointEditSelectContext<LineNode>

  constructor(
    private readonly editorService: EditorService,
    private readonly line: LineNode,
    public name: string
  ) {
    super()
    this.gizmoManager = new GizmoManager(this.editorService, this.line)
    this.moveContext = new MoveContext(
      this.editorService,
      this.line,
      this.gizmoManager,
      `root/document/${line.entityID}/edit/move`
    )
    this.moveContext.setExitContext(this)
    this.editorService.registerContext(this.moveContext.name, this.moveContext)

    this.pointEditSelectContext = new PointEditSelectContext(
      this.editorService,
      this.line,
      this.gizmoManager,
      `root/document/${line.entityID}/edit/points`,
      LineEditContext.linePointEditContextFactory
    )
    this.pointEditSelectContext.setExitContext(this)
    this.editorService.registerContext(
      this.pointEditSelectContext.name,
      this.pointEditSelectContext
    )
  }

  onEntry(): void {
    this.gizmoManager.addOrReplace(EditHighlightGizmo)
  }

  @Command("move")
  private move(): void {
    this.editorService.navigateTo(this.moveContext.name)
  }

  @Command("pointEdit")
  private pointEdit(): void {
    this.editorService.navigateTo(this.pointEditSelectContext.name)
  }

  @Command("toggleEndMarker")
  private toggleEndMarker(): void {
    if (this.line.props.lineProps["marker-end"]) {
      const { "marker-end": _, ...rest } = this.line.props.lineProps
      this.setProps({ ...this.line.props, lineProps: rest })
    } else {
      this.updateLineProps({ "marker-end": "url(#end-arrowhead)" })
    }
  }

  @Command("toggleStartMarker")
  private toggleStartMarker(): void {
    if (this.line.props.lineProps["marker-start"]) {
      const { "marker-start": _, ...rest } = this.line.props.lineProps
      this.setProps({ ...this.line.props, lineProps: rest })
    } else {
      this.updateLineProps({ "marker-start": "url(#start-arrowhead)" })
    }
  }

  private updateLineProps(
    props: Partial<LineNode["props"]["lineProps"]>
  ): void {
    const nextLineProps = { ...this.line.props.lineProps, ...props }
    this.setProps({ ...this.line.props, lineProps: nextLineProps })
  }

  private setProps(props: LineNode["props"]): void {
    this.line.props = props
    this.editorService.setElementCanvasProps(
      this.line.entityID,
      this.line.props
    )
  }

  @Command("exit")
  private exit(): void {
    this.editorService.navigateTo("root")
    this.gizmoManager.remove()
  }

  @Command("cancel")
  private cancel(): void {
    this.editorService.removeElement(this.line)
    this.editorService.removeContext(this.name)
    this.exit()
  }

  onRemove(): void {
    //TODO: remove any sub contexts
  }
}
