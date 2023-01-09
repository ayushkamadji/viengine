import { Command, CommandContext } from "../context/command-decorator"
import { ContextNavigator } from "../context/context-navigator"
import { ElementFunction } from "../ecs-systems/renderer-element"
import { ViEditor } from "../editor"
import { TextBox } from "../editor-components"
import { AbstractContext } from "../context/context.interface"
import { EditorService } from "../editor-service"

export interface ShapeFactory {
  elementFunction: ElementFunction
  editorElement: ElementClass
  registerContext(contextNavigator: ContextNavigator): void
  name: string
  create(...args: any[]): void
}

export class TextBoxFactory implements ShapeFactory {
  elementFunction = TextBox
  editorElement = ViEditor.TextBoxNode
  name = "TextBox"

  constructor(
    private readonly editorService: EditorService,
    private readonly contextNavigator: ContextNavigator
  ) {}

  registerContext(_contextNavigator: ContextNavigator) {}
  create(text = "") {
    const entity = this.editorService.generateEntity()
    const docElement = new this.editorElement(entity, text)
    const editContext = new TextBoxEditContext(
      this.editorService,
      this.contextNavigator,
      docElement
    )
    this.contextNavigator.registerContext(
      `root/document/${entity}/edit`,
      editContext
    )
  }
}

@CommandContext({ keybinds: [["Escape", "exit"]] })
export class TextBoxEditContext extends AbstractContext {
  name = "TextBoxEditContext"

  constructor(
    editorService: EditorService,
    contextNavigator: ContextNavigator,
    private docElement: ViEditor.TextBoxNode
  ) {
    super(contextNavigator)
  }

  onEntry(): void {
    console.log("text box edit on entry")
  }

  @Command("exit")
  private exit(): void {
    this.getNavigator().navigateTo("root")
  }
}

export type ElementClass = { new (...args: any[]): ViEditor.Element }
export type FactoryClass = {
  new (
    editorService: EditorService,
    contextNavigator: ContextNavigator,
    ...args: any[]
  ): ShapeFactory
}

export class FactoryRegistry {
  private factoryMap: Map<ElementClass, ShapeFactory> = new Map()

  constructor(
    private readonly editorService: EditorService,
    private readonly contextNavigator: ContextNavigator
  ) {}

  registerFactory(
    elementClass: ElementClass,
    factoryClass: FactoryClass,
    ...args: any[]
  ): void {
    this.factoryMap.set(
      elementClass,
      new factoryClass(this.editorService, this.contextNavigator, ...args)
    )
  }

  getFactory(elementClass: ElementClass): ShapeFactory | undefined {
    return this.factoryMap.get(elementClass)
  }
}
