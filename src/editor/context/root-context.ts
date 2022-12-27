import { Event } from "../../lib/event"
import { AbstractContext } from "./context.interface"
import { ContextNavigator } from "./context-navigator"
import { UI } from "../editor"
import { NodeCreationContext } from "./node-creation-context"
import { Command, CommandContext } from "./command-decorator"

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
    private readonly ui: UI,
    private readonly editorService,
    contextNavigator: ContextNavigator,
    name = "root"
  ) {
    super(contextNavigator)
    this.name = name
    this.nodeCreationContext = new NodeCreationContext(
      ui,
      editorService,
      contextNavigator,
      "nodeCreation"
    )
    this.nodeCreationContext.setExitContext(this)
    contextNavigator.registerContext(
      `${name}.nodeCreation`,
      this.nodeCreationContext
    )
  }

  onEvent(_event: Event): void {}

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
    const { col: currentCol, row: currentRow } = this.ui.cursor
    this.ui.setCursorPosition(currentCol + deltaX, currentRow + deltaY)
  }
}
