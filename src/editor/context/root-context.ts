import { AbstractContext } from "./context.interface"
import { ContextNavigator } from "./context-navigator"
import { NodeCreationContext } from "./node-creation-context"
import { Command, CommandContext } from "./command-decorator"
import { EditorService } from "../editor-service"
import { FactoryRegistry } from "../shapes/shape-factory"

// TODO: move to json, and figure out how to load
const keybindsJson = {
  h: "moveLeft",
  j: "moveDown",
  k: "moveUp",
  l: "moveRight",
  Enter: "navToCreateNode",
}
const keybinds = Object.entries(keybindsJson)

@CommandContext({ keybinds })
export class RootContext extends AbstractContext {
  name: string
  private readonly nodeCreationContext: NodeCreationContext

  constructor(
    private readonly editorService: EditorService,
    contextNavigator: ContextNavigator,
    private readonly factoryRegistry: FactoryRegistry,
    name = "root"
  ) {
    super(contextNavigator)
    this.name = name
    this.nodeCreationContext = new NodeCreationContext(
      editorService,
      contextNavigator,
      this.factoryRegistry,
      "nodeCreation"
    )
    this.nodeCreationContext.setExitContext(this)
    contextNavigator.registerContext(
      `${name}/nodeCreation`,
      this.nodeCreationContext
    )
  }

  onExit(): void {
    this.editorService.hideMainCursor()
  }

  onEntry(): void {
    this.editorService.showMainCursor()
  }

  @Command("navToCreateNode")
  private navigateToNodeCreationContext(): void {
    this.getNavigator().navigateTo(`${"root"}.nodeCreation`)
  }

  @Command("moveLeft")
  private moveLeft(): void {
    this.moveCursor(-1, 0)
  }

  @Command("moveDown")
  private moveDown(): void {
    this.moveCursor(0, 1)
  }

  @Command("moveUp")
  private moveUp(): void {
    this.moveCursor(0, -1)
  }

  @Command("moveRight")
  private moveRight(): void {
    this.moveCursor(1, 0)
  }

  private moveCursor(deltaX: number, deltaY: number): void {
    const { col: currentCol, row: currentRow } =
      this.editorService.getCursorPosition()
    this.editorService.setCursorPosition(
      currentCol + deltaX,
      currentRow + deltaY
    )
  }
}
