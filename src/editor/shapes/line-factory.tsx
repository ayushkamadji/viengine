import { Command, CommandContext } from "../context/command-decorator"
import { AbstractCommandContext } from "../context/context.interface"
import { ElementFunction } from "../ecs-systems/renderer-element"
import { EditorService } from "../editor-service"
import { Point, StemElement } from "../vieditor-element"
import { ShapeFactory } from "./shape-factory"

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
          <polygon points="0 0, 10 3.5, 0 7" fill={lineProps.stroke} />
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
          <polygon points="10 0, 10 7, 0 3.5" fill={lineProps.stroke} />
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
    this.editorService.navigateTo(`root/document/${entity}/edit`)
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

@CommandContext({
  keybinds: [
    ["h", "moveP2left"],
    ["j", "moveP2down"],
    ["k", "moveP2up"],
    ["l", "moveP2right"],
    ["e", "toggleEndMarker"],
    ["s", "toggleStartMarker"],
    ["Escape", "cancel"],
    ["Enter", "exit"],
  ],
})
export class LineEditContext extends AbstractCommandContext {
  static MOVE_STEP = 10
  constructor(
    private readonly editorService: EditorService,
    private readonly line: LineNode,
    public name: string
  ) {
    super()
  }

  @Command("moveP2up")
  private moveP2up(): void {
    const nextY2 = this.line.props.lineProps.y2 - LineEditContext.MOVE_STEP
    this.updateLineProps({ y2: nextY2 })
  }

  @Command("moveP2down")
  private moveP2down(): void {
    const nextY2 = this.line.props.lineProps.y2 + LineEditContext.MOVE_STEP
    this.updateLineProps({ y2: nextY2 })
  }

  @Command("moveP2left")
  private moveP2left(): void {
    const nextX2 = this.line.props.lineProps.x2 - LineEditContext.MOVE_STEP
    this.updateLineProps({ x2: nextX2 })
  }

  @Command("moveP2right")
  private moveP2right(): void {
    const nextX2 = this.line.props.lineProps.x2 + LineEditContext.MOVE_STEP
    this.updateLineProps({ x2: nextX2 })
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
    this.editorService.setElementProps(this.line.entityID, this.line.props)
  }

  @Command("exit")
  private exit(): void {
    this.editorService.navigateTo("root")
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
