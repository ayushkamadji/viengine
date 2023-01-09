import { AbstractContext, Context, emptyContext } from "./context.interface"
import { ContextNavigator } from "./context-navigator"
import { Node } from "../vieditor-element"
import { EditorService } from "../editor-service"
import { Command, CommandContext } from "./command-decorator"
import { Entity } from "../ecs/entity-component-system"
import { Menu } from "./node-creation-component"
import { ElementFactoryRegistry } from "../shapes/shape-factory"
import { TextBoxNode } from "../shapes/text-box-factory"
import type { ElementClass } from "../shapes/shape-factory"
import { LineNode } from "../shapes/line-factory"

//TODO: move to json
const keybindsJson = {
  Escape: "exit",
  Enter: "line",
}

const keybinds = Object.entries(keybindsJson)

@CommandContext({ keybinds })
export class NodeCreationContext extends AbstractContext {
  name: string
  private exitContext: Context = emptyContext
  private menuEntity: Entity | undefined
  private menuItems = ["exit", "createNode"] //TODO: populate from command [feat(input-menu)]

  constructor(
    private readonly editorService: EditorService,
    contextNavigator: ContextNavigator,
    private readonly factoryRegistry: ElementFactoryRegistry,
    name: string
  ) {
    super(contextNavigator)
    this.name = name
  }

  onEntry(): void {
    this.menuEntity = this.editorService.generateEntity()
    this.createMenuUI(this.menuEntity)
  }

  setExitContext(context: Context): void {
    this.exitContext = context
  }

  @Command("exit")
  private exit(): void {
    this.destroyMenu()
    this.getNavigator().navigateTo(this.exitContext)
  }

  @Command("createNode")
  private createNode(): void {
    this.editorService.addElementAtCursor(
      new Node(this.editorService.generateEntity())
    )
    this.exit()
  }

  @Command("textBox")
  private createTextBox(text = "hello world"): void {
    this.destroyMenu()
    this.createElementNode(TextBoxNode, text)
  }

  @Command("line")
  private createLine(): void {
    this.destroyMenu()
    this.createElementNode(LineNode)
  }

  private createElementNode(element: ElementClass, ...args: any[]) {
    const factory = this.factoryRegistry.getFactory(element)
    if (factory) {
      factory.create(...args)
    }
  }

  private createMenuUI(entity: Entity): void {
    this.editorService.addUIAtCursor(entity, Menu, { items: this.menuItems })
  }

  private destroyMenu(): void {
    if (this.menuEntity) {
      this.editorService.removeEntity(this.menuEntity)
    }
  }
}
