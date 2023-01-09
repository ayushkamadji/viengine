import { AbstractContext, Context, emptyContext } from "./context.interface"
import { ContextNavigator } from "./context-navigator"
import { Node } from "../vieditor-element"
import { EditorService } from "../editor-service"
import { Command, CommandContext } from "./command-decorator"
import { Entity } from "../ecs/entity-component-system"
import { Menu } from "./node-creation-component"
import { ElementFactoryRegistry } from "../shapes/shape-factory"
import { TextBoxNode } from "../shapes/text-box-factory"

//TODO: move to json
const keybindsJson = {
  Escape: "exit",
  Enter: "createTextBox",
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

  @Command("createTextBox")
  private createTextBox(text = "hello world"): void {
    this.destroyMenu()
    const factory = this.factoryRegistry.getFactory(TextBoxNode)
    if (factory) {
      factory.create(text)
    }
    // this.editorService.addElementAtCursor(
    //   new ViEditor.TextBoxNode(this.editorService.generateEntity(), text)
    // )
    // this.exit()
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
