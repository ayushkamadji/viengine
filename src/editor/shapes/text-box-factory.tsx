import { EditorService } from "../editor-service"
import { ShapeFactory } from "./shape-factory"
import { Command, CommandContext } from "../context/command-decorator"
import { AbstractCommandContext } from "../context/context.interface"
import type {
  Element,
  Point,
  TextElement,
  StemElement,
} from "../vieditor-element"
import { ElementFunction } from "../ecs-systems/renderer-element"
import { SVGProps } from "react"
import { MoveContext } from "./edit-context/move-context"
import { InsertModeContext } from "./edit-context/edit-text-context"
import { TextBoxResizeContext } from "./edit-context/resize-context"
import { Entity } from "../ecs/entity-component-system"
import { Geometry } from "../../lib/util/geometry"

export const HIGHLIGHT_COLOR = "#00ffff"

export class TextBoxFactory implements ShapeFactory {
  editorElement = TextBoxNode
  name = "TextBox"

  constructor(private readonly editorService: EditorService) {}

  create(text = "") {
    const entity = this.editorService.generateEntity()
    const docElement = new this.editorElement(entity, text)

    this.editorService.addElementAtCursor(docElement)

    this.registerContexts(docElement)
    this.editorService.navigateTo(`root/document/${entity}/edit/text/insert`)
  }

  load(docElement: TextBoxNode) {
    const entity = this.editorService.generateEntity()
    docElement.entityID = entity

    this.editorService.addElement(docElement)

    this.registerContexts(docElement)
    this.editorService.navigateTo("root")
  }

  private registerContexts(docElement: TextBoxNode) {
    const entity = docElement.entityID
    const editContext = new TextBoxEditContext(
      this.editorService,
      docElement,
      `root/document/${entity}/edit`
    )
    this.editorService.registerContext(editContext.name, editContext)
  }
}

@CommandContext({
  keybinds: [
    ["i", "insert"],
    ["m", "move"],
    ["r", "resize"],
    ["Escape", "exit"],
  ],
})
export class TextBoxEditContext extends AbstractCommandContext {
  private readonly insertModeContext: InsertModeContext
  private readonly moveContext: MoveContext
  private readonly resizeContext: TextBoxResizeContext
  private readonly gizmoManager: GizmoManager

  constructor(
    private readonly editorService: EditorService,
    private docElement: TextBoxNode,
    public name: string
  ) {
    super()

    this.gizmoManager = new GizmoManager(this.editorService, this.docElement)

    this.moveContext = new MoveContext(
      this.editorService,
      this.docElement,
      this.gizmoManager,
      `root/document/${docElement.entityID}/edit/move`
    )
    this.moveContext.setExitContext(this)
    this.editorService.registerContext(this.moveContext.name, this.moveContext)

    this.insertModeContext = new InsertModeContext(
      this.editorService,
      this.docElement,
      `root/document/${docElement.entityID}/edit/text/insert`
    )
    this.insertModeContext.setExitContext(this)
    this.editorService.registerContext(
      this.insertModeContext.name,
      this.insertModeContext
    )

    this.resizeContext = new TextBoxResizeContext(
      this.editorService,
      this.docElement,
      `root/document/${docElement.entityID}/edit/resize`
    )
    this.resizeContext.setExitContext(this)
    this.editorService.registerContext(
      this.resizeContext.name,
      this.resizeContext
    )
  }

  onEntry(): void {
    this.gizmoManager.addOrReplace(HighlightPolygon)
  }

  @Command("move")
  private move(): void {
    this.editorService.navigateTo(this.moveContext)
  }

  @Command("insert")
  private insert(): void {
    this.editorService.navigateTo(this.insertModeContext)
  }

  @Command("resize")
  private resize(): void {
    this.editorService.navigateTo(this.resizeContext)
  }

  @Command("exit")
  private exit(): void {
    this.gizmoManager.remove()
    this.editorService.navigateTo("root")
  }
}

export class GizmoManager {
  private readonly gizmoEntity: Entity
  constructor(
    private readonly editorService: EditorService,
    private readonly element: StemElement
  ) {
    this.gizmoEntity = this.editorService.generateEntity()
  }

  addOrReplace(gizmo: ElementFunction) {
    this.editorService.replaceGizmo(this.gizmoEntity, gizmo, this.getProps())
  }

  update() {
    this.editorService.setElementCanvasProps(this.gizmoEntity, this.getProps())
  }

  private getProps() {
    return {
      points: this.element.geometryFn(),
      x: this.element.position.x,
      y: this.element.position.y,
    }
  }

  remove() {
    this.editorService.removeGizmo(this.gizmoEntity)
  }

  destroy() {
    this.editorService.removeEntity(this.gizmoEntity)
  }
}

export const TextBox: ElementFunction = ({
  rectProps,
  textProps,
  text,
  ...gProps
}: {
  rectProps: SVGProps<SVGRectElement>
  textProps: SVGProps<SVGTextElement>
  text: string
} & SVGProps<SVGGElement>) => {
  return (
    <g {...gProps}>
      <rect {...rectProps}></rect>
      <text {...textProps}>{text}</text>
    </g>
  )
}

export class TextBoxNode implements TextElement {
  static _jsxElementFunction = TextBox // TODO: Move this to the factory
  name = "text-box-node"
  position: Point = { x: 0, y: 0 }
  props = {
    x: 0,
    y: 0,
    transform: "translate(0, 0)",
    width: 220,
    height: 100,
    text: "",
    rectProps: {
      x: 0,
      y: 0,
      width: 220,
      height: 100,
      stroke: "white",
    },
    textProps: {
      x: 110,
      y: 50,
      fill: "white",
      "alignment-baseline": "middle",
      "text-anchor": "middle",
    },
  }

  constructor(public entityID: number, text: string) {
    this.props.text = text
  }
  children?: Element[] | undefined

  get jsxElementFunction() {
    return TextBoxNode._jsxElementFunction
  }

  geometryFn = () => {
    const p1 = this.position
    const p2 = { ...p1, x: p1.x + this.props.width }
    const p3 = { ...p2, y: p2.y + this.props.height }
    const p4 = { ...p3, x: p3.x - this.props.width }

    return [p1, p2, p3, p4]
  }

  setSize(width: number, height: number) {
    this.props.width = width
    this.props.height = height
    this.props.rectProps.width = width
    this.props.rectProps.height = height
    this.props.textProps.x = width / 2
    this.props.textProps.y = height / 2
  }

  setPosition(x: number, y: number) {
    this.props.transform = `translate(${x}, ${y})`
    this.position = { x, y }
  }

  setProps(props: any) {
    this.props = { ...this.props, ...props }
  }
}

export const HighlightPolygon = ({ points }: { points: Geometry }) => {
  const pointArray = Array.isArray(points) ? points : [points.p1, points.p2]
  const props = {
    points: pointArray.map((p) => `${p.x},${p.y}`).join(" "),
    fill: "none",
    stroke: HIGHLIGHT_COLOR,
    "stroke-dasharray": "8 13",
    // TODO: React svg types wants everything in camel case,
    // whereas there are camel and kebab case attributes in SVG
    // Which means this needs manual mapping (reallyy SVG???!!!)
  }
  return (
    <g>
      <polygon {...props} />
    </g>
  )
}
