import { EditorService } from "../../editor-service"
import { Command, CommandContext } from "../../context/command-decorator"
import {
  AbstractCommandContext,
  Context,
  emptyContext,
} from "../../context/context.interface"
import { Event } from "../../../lib/event"
import { KeyDownEvent } from "../../../lib/keyboard-event"
import type { TextElement } from "../../vieditor-element"
import { GizmoManager } from "../gizmo-manager"
import { TextEditorUtil, ZERO_WIDTH_SPACE } from "../../../lib/util/svg-text"
import { clamp } from "../../../lib/util/math"

export class TextEditor {
  static NON_HIGHLIGHTABLE = [ZERO_WIDTH_SPACE]
  private insertIndex: number
  private insertDirection: "left" | "right" = "right"
  private memorizedOffset = 0

  constructor(private readonly docElement: TextElement) {
    this.insertIndex = docElement.props.text.length - 1
    this.memorizedOffset = this.getCurrentLine().length - 1
  }

  /**
   * Move the cursor to the left or right clamped to the bounds of the line row
   * and does not move if the next character is a non-highlightable character
   * @param deltaCol -1 or 1
   * @example moveColumn(-1) // Move left
   * @example moveColumn(1) // Move right
   */
  moveColumn(deltaCol: -1 | 1) {
    const currentLine = this.getCurrentLine()
    const linesUpToCursor = this.getLinesUpToCursor()
    const currentLineOffset =
      linesUpToCursor[linesUpToCursor.length - 1].length - 1
    const maxIndex = currentLine.length - 1

    const nextOffset = clamp(currentLineOffset + deltaCol, 0, maxIndex)
    const nextDelta = nextOffset - currentLineOffset

    if (!TextEditor.NON_HIGHLIGHTABLE.includes(currentLine[nextOffset])) {
      this.insertIndex += nextDelta
    }

    this.memorizedOffset = nextOffset
  }

  /**
   * Move the cursor to the up or down clamped to the min and max number of
   * lines. Remembers which column on the line it should move to from memorized
   * offset. The column moved to is clamped to the max index of the line.
   * @param deltaRow -1 or 1
   * @example moveRow(-1) // Move up
   * @example moveRow(1) // Move down
   */
  moveRow(deltaRow: -1 | 1) {
    const allLines = this.getLines()
    const linesUpToCursor = this.getLinesUpToCursor()
    const currentLineIndex = linesUpToCursor.length - 1
    const maxLineIndex = allLines.length - 1
    const nextLineIndex = clamp(currentLineIndex + deltaRow, 0, maxLineIndex)

    if (nextLineIndex === currentLineIndex) {
      return
    }

    const currentLine = allLines[currentLineIndex]
    const currentLineOffset = linesUpToCursor[currentLineIndex].length - 1
    const nextLine = allLines[nextLineIndex]

    let nextLineStartIndex = 0

    if (deltaRow < 0) {
      nextLineStartIndex =
        this.insertIndex - currentLineOffset - nextLine.length
    } else {
      nextLineStartIndex =
        this.insertIndex + (currentLine.length - currentLineOffset)
    }

    let nextLineOffset = clamp(this.memorizedOffset, 0, nextLine.length - 1)

    // Find a highlightable character
    while (
      TextEditor.NON_HIGHLIGHTABLE.includes(nextLine[nextLineOffset]) &&
      nextLineOffset > 0
    ) {
      nextLineOffset--
    }

    this.insertIndex = nextLineStartIndex + nextLineOffset
  }

  private getCurrentLine() {
    const allLines = this.getLines()
    const linesUpToCursor = this.getLinesUpToCursor()

    return allLines[linesUpToCursor.length - 1]
  }

  private getLinesUpToCursor() {
    return TextEditorUtil.getLines(
      this.docElement.props.text.slice(0, this.insertIndex + 1)
    )
  }

  getLines(): string[] {
    return TextEditorUtil.getLines(this.docElement.props.text)
  }

  getBlockCursorProperties(): {
    x: number
    y: number
    width: number
    height: number
  } {
    const textXOffset =
      this.docElement.position.x + this.docElement.props.textProps.x
    const textYOffset =
      this.docElement.position.y + this.docElement.props.textProps.y

    // Vertical and horizontal align middle
    const allLines = this.getLines()
    const linesUpToCursor = this.getLinesUpToCursor()

    //// Calculate Y
    const lineHeight = this.docElement.props.textProps.style.lineHeight
    const lineYOffset = TextEditorUtil.getLineYOffset(
      linesUpToCursor.length - 1,
      allLines.length,
      lineHeight
    )
    const y = textYOffset - lineHeight / 2 + lineYOffset

    //// Calculate X
    const font = this.docElement.props.textProps.style.font
    const lineUpToCursor = linesUpToCursor[linesUpToCursor.length - 1]
    const rightBoundWidth = TextEditorUtil.getTextWidth(lineUpToCursor, font)
    const leftBoundWidth = TextEditorUtil.getTextWidth(
      lineUpToCursor.slice(0, -1),
      font
    )
    const line = allLines[linesUpToCursor.length - 1]
    const lineWidth = TextEditorUtil.getTextWidth(line, font)
    const x = textXOffset - lineWidth / 2 + leftBoundWidth

    // Width & Height
    const width = rightBoundWidth - leftBoundWidth
    const height = lineHeight

    return {
      x,
      y,
      width,
      height,
    }
  }
}

export const TextBlockCursor = ({ x, y, width, height }) => {
  return (
    <g>
      <rect
        id="text-cursor"
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#0f0"
      />
    </g>
  )
}

@CommandContext({
  keybinds: [
    ["h", "moveLeft"],
    ["j", "moveDown"],
    ["k", "moveUp"],
    ["l", "moveRight"],
    ["Escape", "exit"],
  ],
})
export class NormalModeContext extends AbstractCommandContext {
  private exitContext: Context = emptyContext

  constructor(
    private readonly editorService: EditorService,
    private docElement: TextElement,
    private readonly gizmoManager: GizmoManager,
    private readonly textEditor: TextEditor,
    public name: string
  ) {
    super()
  }

  onEntry(): void {
    const props = this.textEditor.getBlockCursorProperties()
    this.gizmoManager.addOrReplace(TextBlockCursor, props)
  }

  setExitContext(context: Context) {
    this.exitContext = context
  }

  @Command("exit")
  private exit(): void {
    this.editorService.navigateTo(this.exitContext)
  }

  @Command("moveLeft")
  private moveLeft(): void {
    this.textEditor.moveColumn(-1)
    this.updateCursor()
  }

  @Command("moveRight")
  private moveRight(): void {
    this.textEditor.moveColumn(1)
    this.updateCursor()
  }

  @Command("moveUp")
  private moveUp(): void {
    this.textEditor.moveRow(-1)
    this.updateCursor()
  }

  @Command("moveDown")
  private moveDown(): void {
    this.textEditor.moveRow(1)
    this.updateCursor()
  }

  private updateCursor() {
    const props = this.textEditor.getBlockCursorProperties()
    this.gizmoManager.update(props)
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
