import { EditorService } from "../editor-service"
import { ShapeFactory } from "./shape-factory"
import { Command, CommandContext } from "../context/command-decorator"
import {
  AbstractCommandContext,
  AbstractContext,
  Context,
  emptyContext,
} from "../context/context.interface"
import { Event } from "../../lib/event"
import { KeyDownEvent } from "../../lib/keyboard-event"
import type { Element, Point, TextElement } from "../vieditor-element"
import { ElementFunction } from "../ecs-systems/renderer-element"
import { SVGProps } from "react"

const printableKeys = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
]

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
    ["Escape", "exit"],
    ["i", "insert"],
    ["h", "moveLeft"],
    ["j", "moveDown"],
    ["k", "moveUp"],
    ["l", "moveRight"],
  ],
})
export class TextBoxEditContext extends AbstractCommandContext {
  private readonly insertModeContext: InsertModeContext

  constructor(
    private readonly editorService: EditorService,
    private docElement: TextBoxNode,
    public name: string
  ) {
    super()
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
  }

  onEntry(): void {
    console.log("text box edit on entry")
  }

  @Command("insert")
  private insert(): void {
    this.editorService.navigateTo(this.insertModeContext.name)
  }

  @Command("moveLeft")
  private moveLeft() {
    this.editorService.moveElement(this.docElement, -1, 0)
  }

  @Command("moveDown")
  private moveDown() {
    this.editorService.moveElement(this.docElement, 0, 1)
  }

  @Command("moveUp")
  private moveUp() {
    this.editorService.moveElement(this.docElement, 0, -1)
  }

  @Command("moveRight")
  private moveRight() {
    this.editorService.moveElement(this.docElement, 1, 0)
  }

  @Command("exit")
  private exit(): void {
    this.editorService.navigateTo("root")
  }
}

export class NormalModeContext extends AbstractContext {
  name = "NormalModeContext"

  constructor(private readonly editorService: EditorService) {
    super()
  }
}

@CommandContext({
  keybinds: [["Escape", "exit"]],
})
export class InsertModeContext extends AbstractCommandContext {
  private exitContext: Context = emptyContext

  constructor(
    private readonly editorService: EditorService,
    private docElement: TextElement,
    public name: string
  ) {
    super()
  }

  onEvent(event: Event) {
    if (event instanceof KeyDownEvent) {
      this.onKeyType(event.key)
    }
  }

  private onKeyType(key: string) {
    const isPrintable = printableKeys.includes(key)
    const isBackspace = key === "Backspace"
    if (isPrintable || isBackspace) {
      const currentText = this.docElement.props.text
      let newText
      if (isPrintable) {
        newText = currentText + key
      } else {
        newText = currentText.slice(0, -1)
      }
      this.docElement.props.text = newText
      this.editorService.setElementProps(this.docElement.entityID, {
        text: newText,
      })
    }
  }

  @Command("exit")
  private exit(): void {
    this.editorService.navigateTo(this.exitContext)
  }

  setExitContext(context: Context) {
    this.exitContext = context
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

  setPosition(x: number, y: number) {
    this.props.transform = `translate(${x}, ${y})`
    this.position = { x, y }
  }

  setProps(props: any) {
    this.props = { ...this.props, ...props }
  }
}
