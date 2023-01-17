import { EditorService } from "../editor-service"
import { ShapeFactory } from "./shape-factory"
import { Command, CommandContext } from "../context/command-decorator"
import { AbstractCommandContext } from "../context/context.interface"
import type { Element, Point, TextElement } from "../vieditor-element"
import { ElementFunction } from "../ecs-systems/renderer-element"
import { SVGProps } from "react"
import { MoveContext } from "./edit-context/move-context"
import { InsertModeContext } from "./InsertModeContext"
import { TextBoxResizeContext } from "./edit-context/resize-context"
import { Entity } from "../ecs/entity-component-system"

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
  private highlightEntity: Entity | undefined

  constructor(
    private readonly editorService: EditorService,
    private docElement: TextBoxNode,
    public name: string
  ) {
    super()
    this.moveContext = new MoveContext(
      this.editorService,
      this.docElement,
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
    this.highlightEntity = this.editorService.generateEntity()
    this.editorService.addGizmo(this.highlightEntity, HighlightPolygon, {
      points: this.docElement.geometryFn(),
      x: this.docElement.position.x,
      y: this.docElement.position.y,
    })
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
    this.editorService.navigateTo("root")
    if (this.highlightEntity)
      this.editorService.removeEntity(this.highlightEntity)
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

const HighlightPolygon = ({ points }: { points: Point[] }) => {
  return (
    <g>
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="blue"
        strokeDasharray="10,10"
      />
    </g>
  )
}
