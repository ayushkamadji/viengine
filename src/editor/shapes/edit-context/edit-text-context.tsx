import { EditorService } from "../../editor-service"
import { Command, CommandContext } from "../../context/command-decorator"
import {
  AbstractCommandContext,
  AbstractContext,
  Context,
  emptyContext,
} from "../../context/context.interface"
import { Event } from "../../../lib/event"
import { KeyDownEvent } from "../../../lib/keyboard-event"
import type { TextElement } from "../../vieditor-element"
import { GizmoManager } from "../gizmo-manager"

export class NormalModeContext extends AbstractContext {
  name = "NormalModeContext"

  constructor(private readonly editorService: EditorService) {
    super()
  }
}

@CommandContext({
  keybinds: [
    ["Backspace", "backspace"],
    ["Escape", "exit"],
  ],
})
export class InsertModeContext extends AbstractCommandContext {
  private exitContext: Context = emptyContext

  constructor(
    private readonly editorService: EditorService,
    private docElement: TextElement,
    private readonly gizmoManager: GizmoManager,
    public name: string
  ) {
    super()
  }

  async onEvent(event: Event) {
    if (event instanceof KeyDownEvent) {
      if (event.key) {
        this.onKeyType(event.key)
      }
    }
  }

  private onKeyType(key: string | null) {
    const currentText = this.docElement.props.text
    const newText = currentText + key
    this.updateText(newText)
  }

  @Command("backspace")
  private backspace(): void {
    const currentText = this.docElement.props.text
    const newText = currentText.slice(0, -1)
    this.updateText(newText)
  }

  private updateText(text: string) {
    this.docElement.props.text = text
    this.editorService.setElementCanvasProps(this.docElement.entityID, {
      text,
    })
  }

  @Command("exit")
  private exit(): void {
    this.editorService.navigateTo(this.exitContext)
  }

  setExitContext(context: Context) {
    this.exitContext = context
  }

  onEntry(): void {
    this.gizmoManager.remove()
  }
}
