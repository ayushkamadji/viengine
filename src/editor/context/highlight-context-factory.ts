import { Direction } from "../../lib/util/geometry"
import type { HighlightParams } from "../ecs-systems/selector-system"
import type { Entity } from "../ecs/entity-component-system"
import { EditorService } from "../editor-service"
import { Command, CommandContext } from "./command-decorator"
import { ContextNavigator } from "./context-navigator"
import { AbstractContext, Context, ContextFactory } from "./context.interface"

export class HighlightContextFactory implements ContextFactory {
  constructor(
    private readonly editorService: EditorService,
    private readonly contextNavigator: ContextNavigator
  ) {}
  create(entity: Entity, params: HighlightParams): Context {
    const name = `/root/highlight/${entity}`
    return new HighlightContext(
      this.editorService,
      this.contextNavigator,
      name,
      entity,
      params
    )
  }
}

@CommandContext({
  keybinds: [
    ["h", "moveLeft"],
    ["j", "moveDown"],
    ["k", "moveUp"],
    ["l", "moveRight"],
    ["Enter", "edit"],
  ],
})
export class HighlightContext extends AbstractContext {
  constructor(
    private readonly editorService: EditorService,
    contextNavigator: ContextNavigator,
    readonly name,
    private readonly entity: Entity,
    private readonly highlightParams: HighlightParams
  ) {
    super(contextNavigator)
  }

  @Command("moveLeft")
  private moveLeft(): void {
    this.move(Direction.LEFT)
  }

  @Command("moveRight")
  private moveRight(): void {
    this.move(Direction.RIGHT)
  }

  @Command("moveUp")
  private moveUp(): void {
    this.move(Direction.UP)
  }

  @Command("moveDown")
  private moveDown(): void {
    this.move(Direction.DOWN)
  }

  private move(direction: Direction): void {
    const { col, row } = this.highlightParams.exitPositions[direction]
    // this.editorService.cursorExitEntityGeometry(this.entity, direction)
    this.editorService.setCursorPosition(col, row)
    this.getNavigator().navigateTo("root")
  }

  @Command("edit")
  private edit(): void {
    this.getNavigator().navigateTo(`root/document/${this.entity}/edit`)
  }

  onEntry() {
    this.editorService.addHighlighter(this.entity)
  }

  onExit() {
    this.editorService.removeHighlighter()
  }
}