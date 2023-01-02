import { Event } from "../../lib/event"
import { AbstractContext, Context, emptyContext } from "./context.interface"
import { ContextNavigator } from "./context-navigator"
import { ViEditor, EditorService } from "../editor"
import { Command, CommandContext } from "./command-decorator"
import { Entity } from "../ecs/entity-component-system"

//TODO: move to json
const keybindsJson = {
  Escape: "exit",
  Enter: "createNode",
}

const keybinds = Object.entries(keybindsJson)

@CommandContext({ keybinds })
export class NodeCreationContext extends AbstractContext {
  name: string
  private exitContext: Context = emptyContext
  private menuEntity: Entity | undefined

  constructor(
    private readonly editorService: EditorService,
    contextNavigator: ContextNavigator,
    name: string
  ) {
    super(contextNavigator)
    this.name = name
  }

  onEntry(): void {
    this.menuEntity = this.editorService.generateEntity()
    this.createMenuUI(this.menuEntity)
  }

  onEvent(_event: Event): void {}

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
      new ViEditor.Node(this.editorService.generateEntity())
    )
    this.exit()
  }

  private createMenuUI(entity: Entity): void {
    this.editorService.addUIAtCursor(entity)
  }

  private destroyMenu(): void {
    if (this.menuEntity) {
      this.editorService.removeEntity(this.menuEntity)
    }
  }
}
