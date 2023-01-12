import { AbstractCommandContext } from "./context.interface"
import { NodeCreationContext } from "./node-creation-context"
import { Command, CommandContext } from "./command-decorator"
import { EditorService } from "../editor-service"
import { ElementFactoryRegistry } from "../shapes/shape-factory"
import { HighlightContextFactory } from "./highlight-context-factory"
import { Entity } from "../ecs/entity-component-system"
import { HighlightParams } from "../ecs-systems/selector-system"

// TODO: move to json, and figure out how to load
const keybindsJson = {
  h: "moveLeft",
  j: "moveDown",
  k: "moveUp",
  l: "moveRight",
  Enter: "createNode",
  "?": "toggleHints",
}
const keybinds = Object.entries(keybindsJson)

@CommandContext({ keybinds })
export class RootContext extends AbstractCommandContext {
  name: string
  private readonly nodeCreationContext: NodeCreationContext
  private readonly highlightContextFactory: HighlightContextFactory

  constructor(
    private readonly editorService: EditorService,
    private readonly factoryRegistry: ElementFactoryRegistry,
    name = "root"
  ) {
    super()
    this.name = name
    this.nodeCreationContext = new NodeCreationContext(
      editorService,
      this.factoryRegistry,
      "nodeCreation"
    )
    this.nodeCreationContext.setExitContext(this)
    editorService.registerContext(
      `${name}/nodeCreation`,
      this.nodeCreationContext
    )

    this.highlightContextFactory = new HighlightContextFactory(
      this.editorService
    )
    this.editorService.registerContext(
      "/root/highlight",
      this.highlightContextFactory
    )
  }

  onExit(): void {
    this.editorService.hideMainCursor()
  }

  onEntry(): void {
    this.editorService.showMainCursor()
  }

  @Command("createNode")
  private navigateToNodeCreationContext(): void {
    this.editorService.navigateTo(`${"root"}/nodeCreation`)
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

  @Command("toggleHints")
  private toggleHints(): void {
    this.editorService.toggleHints()
  }

  private moveCursor(deltaX: number, deltaY: number): void {
    this.editorService.showMainCursor()
    const { col: currentCol, row: currentRow } =
      this.editorService.getCursorPosition()
    this.editorService.setCursorPosition(
      currentCol + deltaX,
      currentRow + deltaY
    )
  }

  onHighlight(entity: Entity, params: HighlightParams): void {
    this.editorService.navigateTo("/root/highlight", entity, params)
  }
}
