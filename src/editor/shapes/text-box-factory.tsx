import { EditorService } from "../editor-service"
import { ShapeFactory } from "./shape-factory"
import { Command, CommandContext } from "../context/command-decorator"
import {
  AbstractCommandContext,
  Context,
  emptyContext,
} from "../context/context.interface"
import type { Element, Point, TextElement } from "../vieditor-element"
import { ElementFunction } from "../ecs-systems/renderer-element"
import { SVGProps } from "react"
import { MoveContext } from "./edit-context/move-context"
import {
  InsertModeContext,
  NormalModeContext,
  TextEditor,
} from "./edit-context/edit-text-context"
import { TextBoxResizeContext } from "./edit-context/resize-context"
import { GizmoManager } from "./gizmo-manager"
import { EditHighlightGizmo } from "./edit-highlight-gizmo"
import {
  MoveHandler,
  PointEditContext,
  PointEditContextFactory,
  PointEditSelectContext,
  PointGizmo,
} from "./edit-context/point-edit-context"
import { bodyFont, fontSize, TextEditorUtil } from "../../lib/util/svg-text"

export const HIGHLIGHT_COLOR = "#00ffff"
export const SIZING_STEP = 10
export const LINE_HEIGHT_FONT_MULTIPLIER = 1.2

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

type TextBoxMoveHandler = MoveHandler<TextBoxNode>

export class TextBoxPointEditContextFactory
  implements PointEditContextFactory<TextBoxNode>
{
  private moveHandlers: TextBoxMoveHandler[] = [
    this.handleMoveP1,
    this.handleMoveP2,
    this.handleMoveP3,
    this.handleMoveP4,
  ]

  create(
    editorService: EditorService,
    element: TextBoxNode,
    gizmoManager: GizmoManager,
    parentName: string,
    index: number
  ): TextBoxPointEditContext {
    return new TextBoxPointEditContext(
      editorService,
      element,
      gizmoManager,
      `${parentName}/${index}`,
      this.moveHandlers[index - 1],
      index - 1
    )
  }

  private handleMoveP1(element: TextBoxNode, deltaX: number, deltaY: number) {
    const { x, y } = element.position
    const { width, height } = element.props
    element.setPosition(x + deltaX, y + deltaY)
    element.setSize(width - deltaX, height - deltaY)
  }

  private handleMoveP2(element: TextBoxNode, deltaX: number, deltaY: number) {
    const { x, y } = element.position
    const { width, height } = element.props
    element.setPosition(x, y + deltaY)
    element.setSize(width + deltaX, height - deltaY)
  }

  private handleMoveP3(element: TextBoxNode, deltaX: number, deltaY: number) {
    const { x, y } = element.position
    const { width, height } = element.props
    element.setPosition(x, y)
    element.setSize(width + deltaX, height + deltaY)
  }

  private handleMoveP4(element: TextBoxNode, deltaX: number, deltaY: number) {
    const { x, y } = element.position
    const { width, height } = element.props
    element.setPosition(x + deltaX, y)
    element.setSize(width - deltaX, height + deltaY)
  }
}

@CommandContext({
  keybinds: [
    ["h", "moveLeft"],
    ["j", "moveDown"],
    ["k", "moveUp"],
    ["l", "moveRight"],
    ["Escape", "exit"],
  ],
})
export class TextBoxPointEditContext
  extends AbstractCommandContext
  implements PointEditContext
{
  private _exitContext: Context = emptyContext

  constructor(
    private readonly editorService: EditorService,
    private readonly element: TextBoxNode,
    private readonly gizmoManager: GizmoManager,
    public name: string,
    private readonly onMove: TextBoxMoveHandler,
    private readonly pointIndex: number
  ) {
    super()
  }

  @Command("moveUp")
  private moveUp(): void {
    this.movePoint(0, -SIZING_STEP)
  }

  @Command("moveDown")
  private moveDown(): void {
    this.movePoint(0, SIZING_STEP)
  }

  @Command("moveLeft")
  private moveLeft(): void {
    this.movePoint(-SIZING_STEP, 0)
  }

  @Command("moveRight")
  private moveRight(): void {
    this.movePoint(SIZING_STEP, 0)
  }

  movePoint(deltaX: number, deltaY: number): void {
    this.onMove(this.element, deltaX, deltaY)
    this.editorService.setElementCanvasProps(
      this.element.entityID,
      this.element.props
    )
    this.updateGizmo()
  }

  setExitContext(context: Context): void {
    this._exitContext = context
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
    return this.element.geometryFn()[this.pointIndex]
  }

  @Command("exit")
  private exit(): void {
    this.editorService.navigateTo(this._exitContext)
  }
}

@CommandContext({
  keybinds: [
    ["i", "insert"],
    ["m", "move"],
    ["r", "resize"],
    ["p", "pointEdit"],
    ["Escape", "exit"],
  ],
})
export class TextBoxEditContext extends AbstractCommandContext {
  static textBoxPointEditContextFactory = new TextBoxPointEditContextFactory()
  private readonly insertModeContext: InsertModeContext
  private readonly normalModeContext: NormalModeContext
  private readonly moveContext: MoveContext
  private readonly resizeContext: TextBoxResizeContext
  private readonly pointEditSelectContext: PointEditSelectContext<TextBoxNode>
  private readonly gizmoManager: GizmoManager
  private readonly textEditor: TextEditor

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

    // Text edit context
    this.textEditor = new TextEditor(this.docElement)
    this.insertModeContext = new InsertModeContext(
      this.editorService,
      this.docElement,
      this.gizmoManager,
      this.textEditor,
      `root/document/${docElement.entityID}/edit/text/insert`
    )
    this.normalModeContext = new NormalModeContext(
      this.editorService,
      this.docElement,
      this.gizmoManager,
      this.textEditor,
      this.insertModeContext,
      `root/document/${docElement.entityID}/edit/text/normal`
    )
    this.normalModeContext.setExitContext(this)
    this.insertModeContext.setExitContext(this.normalModeContext)
    this.editorService.registerContext(
      this.normalModeContext.name,
      this.normalModeContext
    )
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

    this.pointEditSelectContext = new PointEditSelectContext(
      this.editorService,
      this.docElement,
      this.gizmoManager,
      `root/document/${docElement.entityID}/edit/points`,
      TextBoxEditContext.textBoxPointEditContextFactory
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
    this.editorService.navigateTo(this.moveContext)
  }

  @Command("insert")
  private insert(): void {
    this.editorService.navigateTo(this.insertModeContext, {
      insertPosition: "end",
    })
  }

  @Command("resize")
  private resize(): void {
    this.editorService.navigateTo(this.resizeContext)
  }

  @Command("pointEdit")
  private pointEdit(): void {
    this.editorService.navigateTo(this.pointEditSelectContext)
  }

  @Command("exit")
  private exit(): void {
    this.gizmoManager.remove()
    this.editorService.navigateTo("root")
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
  const lines = TextEditorUtil.getLines(text)
  const tSpanProps = {
    "text-anchor": textProps["text-anchor"],
    "alignment-baseline": textProps["alignment-baseline"],
  }

  return (
    <g {...gProps}>
      <rect {...rectProps}></rect>
      <text {...textProps}>
        {lines.map((line, i) => {
          const dy = TextEditorUtil.getLineDYOffset(
            i,
            lines.length,
            textProps.style!.lineHeight as number
          )

          return (
            <tspan
              key={`text-${gProps.id}-${i}`}
              x={textProps.x}
              dy={dy}
              {...tSpanProps}
            >
              {line}
            </tspan>
          )
        })}
      </text>
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
    id: this.entityID,
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
      style: {
        font: bodyFont,
        lineHeight: fontSize * LINE_HEIGHT_FONT_MULTIPLIER,
      },
      fill: "#fff",
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
