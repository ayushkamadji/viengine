import { Direction } from "../../lib/util/geometry"
import type { HighlightParams } from "../ecs-systems/selector-system"
import type { Entity } from "../ecs/entity-component-system"
import { EditorService } from "../editor-service"
import { Command, CommandContext } from "./command-decorator"
import {
  AbstractCommandContext,
  Context,
  ContextFactory,
} from "./context.interface"

export class HighlightContextFactory implements ContextFactory {
  constructor(private readonly editorService: EditorService) {}
  create(entity: Entity, params: HighlightParams): Context {
    const name = `/root/highlight/${entity}`
    return new HighlightContext(this.editorService, name, entity, params)
  }
}

@CommandContext({
  keybinds: [
    ["h", "moveLeft"],
    ["j", "moveDown"],
    ["k", "moveUp"],
    ["l", "moveRight"],
    ["d", "delete"],
    ["x", "delete"],
    ["y", "yank"],
    ["Enter", "edit"],
  ],
})
export class HighlightContext extends AbstractCommandContext {
  constructor(
    private readonly editorService: EditorService,
    readonly name,
    private readonly entity: Entity,
    private readonly highlightParams: HighlightParams
  ) {
    super()
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
    this.editorService.setCursorPosition(col, row)
    this.exit()
  }

  @Command("edit")
  private edit(): void {
    this.editorService.navigateTo(`root/document/${this.entity}/edit`)
  }

  @Command("delete")
  private delete(): void {
    this.editorService.cutElement(this.entity)
    this.exit()
  }

  @Command("yank")
  private yank(): void {
    this.editorService.copyElement(this.entity)
    this.exit()
  }

  private exit() {
    this.editorService.navigateTo("root")
  }

  onEntry() {
    this.editorService.addHighlighter(this.entity)
  }

  onExit() {
    this.editorService.removeHighlighter()
  }
}
