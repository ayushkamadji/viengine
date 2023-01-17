import { Command, CommandContext } from "../../context/command-decorator"
import {
  AbstractCommandContext,
  Context,
  emptyContext,
} from "../../context/context.interface"
import { MoveIcon } from "../../context/root-components"
import { EditorService } from "../../editor-service"
import type { StemElement } from "../../vieditor-element"

@CommandContext({
  keybinds: [
    ["h", "moveLeft"],
    ["j", "moveDown"],
    ["k", "moveUp"],
    ["l", "moveRight"],
    ["Escape", "exit"],
  ],
})
export class MoveContext extends AbstractCommandContext {
  private _exitContext: Context
  constructor(
    private readonly editorService: EditorService,
    private readonly element: StemElement,
    readonly name: string
  ) {
    super()
    this._exitContext = emptyContext
  }

  @Command("moveLeft")
  private moveLeft() {
    this.editorService.moveElement(this.element, -0.25, 0)
  }

  @Command("moveDown")
  private moveDown() {
    this.editorService.moveElement(this.element, 0, 0.25)
  }

  @Command("moveUp")
  private moveUp() {
    this.editorService.moveElement(this.element, 0, -0.25)
  }

  @Command("moveRight")
  private moveRight() {
    this.editorService.moveElement(this.element, 0.25, 0)
  }

  // TODO: Navigational commands should be abstracted to abstract class
  @Command("exit")
  private exit() {
    this.editorService.navigateTo(this._exitContext)
  }

  setExitContext(context: Context) {
    this._exitContext = context
  }

  onEntry() {
    this.editorService.addHighlighter(this.element.entityID, MoveIcon)
  }

  onExit() {
    this.editorService.removeHighlighter()
  }
}
