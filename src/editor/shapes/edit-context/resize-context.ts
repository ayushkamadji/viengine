import { Command, CommandContext } from "../../context/command-decorator"
import {
  AbstractCommandContext,
  Context,
  emptyContext,
} from "../../context/context.interface"
import { EditorService } from "../../editor-service"
import { TextBoxNode } from "../text-box-factory"

const MOVE_STEP = 10

// TODO: Deprecate (will be redone when implementing dimension resizable shapes)
export class ResizeContext extends AbstractCommandContext {}

@CommandContext({
  keybinds: [
    ["h", "moveP3Left"],
    ["j", "moveP3Down"],
    ["k", "moveP3Up"],
    ["l", "moveP3Right"],
    ["Escape", "exit"],
  ],
})
export class TextBoxResizeContext extends ResizeContext {
  private _exitContext: Context = emptyContext
  constructor(
    private readonly editorService: EditorService,
    private readonly element: TextBoxNode,
    public name: string
  ) {
    super()
  }

  @Command("moveP3Right")
  private moveP3Right() {
    const { width, height } = this.element.props
    this.element.setSize(width + MOVE_STEP, height)
    this.updateElementProps()
  }

  @Command("moveP3Left")
  private moveP3Left() {
    const { width, height } = this.element.props
    this.element.setSize(width - MOVE_STEP, height)
    this.updateElementProps()
  }

  @Command("moveP3Up")
  private moveP3Up() {
    const { width, height } = this.element.props
    this.element.setSize(width, height - MOVE_STEP)
    this.updateElementProps()
  }

  @Command("moveP3Down")
  private moveP3Down() {
    const { width, height } = this.element.props
    this.element.setSize(width, height + MOVE_STEP)
    this.updateElementProps()
  }

  private updateElementProps() {
    this.editorService.setElementCanvasProps(
      this.element.entityID,
      this.element.props
    )
  }

  @Command("exit")
  private exit() {
    this.editorService.navigateTo(this._exitContext)
  }

  setExitContext(context: Context) {
    this._exitContext = context
  }
}

export class PointMoveContext extends AbstractCommandContext {}
