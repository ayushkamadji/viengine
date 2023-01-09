import { ContextNavigator } from "../context/context-navigator"
import { TextBox } from "../editor-components"
import { EditorService } from "../editor-service"
import { ShapeFactory } from "./shape-factory"
import { Command, CommandContext } from "../context/command-decorator"
import {
  AbstractContext,
  Context,
  emptyContext,
} from "../context/context.interface"
import { Event, KeyDownEvent } from "../../lib/event"
import type { TextElement } from "../vieditor-element"

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

  constructor(
    private readonly editorService: EditorService,
    private readonly contextNavigator: ContextNavigator
  ) {}

  create(text = "") {
    const entity = this.editorService.generateEntity()
    const docElement = new this.editorElement(entity, text)

    this.editorService.addElementAtCursor(docElement)

    const editContext = new TextBoxEditContext(
      this.editorService,
      this.contextNavigator,
      docElement,
      `root/document/${entity}/edit`
    )
    this.contextNavigator.registerContext(editContext.name, editContext)
    this.contextNavigator.navigateTo(`root/document/${entity}/edit/text/insert`)
  }
}

@CommandContext({ keybinds: [["Escape", "exit"]] })
export class TextBoxEditContext extends AbstractContext {
  private readonly insertModeContext: InsertModeContext

  constructor(
    private readonly editorService: EditorService,
    contextNavigator: ContextNavigator,
    private docElement: TextBoxNode,
    public name: string
  ) {
    super(contextNavigator)
    this.insertModeContext = new InsertModeContext(
      this.editorService,
      this.getNavigator(),
      this.docElement,
      `root/document/${docElement.entityID}/edit/text/insert`
    )
    this.insertModeContext.setExitContext(this)
    this.getNavigator().registerContext(
      this.insertModeContext.name,
      this.insertModeContext
    )
  }

  onEntry(): void {
    console.log("text box edit on entry")
  }

  @Command("exit")
  private exit(): void {
    this.getNavigator().navigateTo("root")
  }
}

export class NormalModeContext extends AbstractContext {
  name = "NormalModeContext"

  constructor(
    private readonly editorService: EditorService,
    contextNavigator: ContextNavigator
  ) {
    super(contextNavigator)
  }
}

@CommandContext({ keybinds: [["Escape", "exit"]] })
export class InsertModeContext extends AbstractContext {
  private exitContext: Context = emptyContext

  constructor(
    private readonly editorService: EditorService,
    contextNavigator: ContextNavigator,
    private docElement: TextElement,
    public name: string
  ) {
    super(contextNavigator)
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
    this.getNavigator().navigateTo(this.exitContext)
  }

  setExitContext(context: Context) {
    this.exitContext = context
  }
}

export class TextBoxNode implements TextElement {
  static _jsxElementFunction = TextBox // TODO: Move this to the factory
  name = "text-box-node"
  props = {
    x: 0,
    y: 0,
    transform: "",
    width: 280,
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

  get jsxElementFunction() {
    return TextBoxNode._jsxElementFunction
  }

  setPosition(x: number, y: number) {
    this.props.transform = `translate(${x}, ${y})`
  }

  setProps(props: any) {
    this.props = { ...this.props, ...props }
  }
}
