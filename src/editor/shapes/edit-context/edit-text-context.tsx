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
import { getTextMetrics, getTextWidth } from "../../../lib/util/svg-text"
import { clamp } from "../../../lib/util/math"
import { ElementFunction } from "../../ecs-systems/renderer-element"

@CommandContext({
  keybinds: [
    ["h", "moveLeft"],
    ["j", "moveDown"],
    ["k", "moveUp"],
    ["l", "moveRight"],
    ["i", "insert"],
    ["a", "insertAfter"],
    ["Escape", "exit"],
  ],
})
export class NormalModeContext extends AbstractCommandContext {
  private _exitContext: Context = emptyContext

  constructor(
    private readonly editorService: EditorService,
    private docElement: TextElement,
    private readonly gizmoManager: GizmoManager,
    private readonly textEditManager: TextEditManager,
    private readonly insertModeContext: InsertModeContext,
    readonly name: string
  ) {
    super()
  }

  setExitContext(context: Context) {
    this._exitContext = context
  }

  @Command("exit")
  private exit(): void {
    this.editorService.navigateTo(this._exitContext)
  }

  onEntry() {
    const blockCursorProps = this.textEditManager.getBlockCursorProps()
    this.gizmoManager.addOrReplace(TextBlockCursor, {
      ...blockCursorProps,
    })
  }

  @Command("moveLeft")
  private moveLeft() {
    this.moveCursor(-1, 0)
  }

  @Command("moveRight")
  private moveRight() {
    this.moveCursor(1, 0)
  }

  @Command("moveUp")
  private moveUp() {
    this.moveCursor(0, -1)
  }

  @Command("moveDown")
  private moveDown() {
    this.moveCursor(0, 1)
  }

  @Command("insert")
  private insert() {
    this.editorService.navigateTo(this.insertModeContext, {
      insertSide: "left",
    })
  }

  @Command("insertAfter")
  private insertAfter() {
    this.editorService.navigateTo(this.insertModeContext, {
      insertSide: "right",
    })
  }

  private moveCursor(deltaCol: CellDelta, deltaRow: CellDelta) {
    this.textEditManager.changePosition(deltaCol, deltaRow)
    const blockCursorProps = this.textEditManager.getBlockCursorProps()
    this.gizmoManager.update({ ...blockCursorProps })
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
    ["↓", "moveDown"],
    ["←", "moveLeft"],
    ["→", "moveRight"],
    ["↑", "moveUp"],
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
    private readonly textEditManager: TextEditManager,
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

  private onKeyType(key: string) {
    const currentText = this.docElement.props.text
    const insertIndex = this.textEditManager.getInsertIndex()
    const newText =
      currentText.slice(0, insertIndex) + key + currentText.slice(insertIndex)
    this.updateText(newText)
    this.textEditManager.updateOnKeyType(key)
    this.updateCursor()
  }

  @Command("backspace")
  private backspace(): void {
    const currentText = this.docElement.props.text
    const insertIndex = this.textEditManager.getInsertIndex()
    const newText =
      currentText.slice(0, insertIndex - 1) + currentText.slice(insertIndex)
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

  @Command("moveLeft")
  private moveLeft() {
    this.moveCursor(-1, 0)
  }

  @Command("moveRight")
  private moveRight() {
    this.moveCursor(1, 0)
  }

  @Command("moveUp")
  private moveUp() {
    this.moveCursor(0, -1)
  }

  @Command("moveDown")
  private moveDown() {
    this.moveCursor(0, 1)
  }

  private moveCursor(deltaCol: CellDelta, deltaRow: CellDelta) {
    this.textEditManager.changePosition(deltaCol, deltaRow)
    this.updateCursor()
  }

  private updateCursor() {
    const lineCursorProps = this.textEditManager.getLineCursorProps()
    this.gizmoManager.update({ ...lineCursorProps })
  }

  setExitContext(context: Context) {
    this.exitContext = context
  }

  onEntry({ insertSide }: { insertSide?: InsertSide } = {}): void {
    if (insertSide) {
      this.textEditManager.setInsertSide(insertSide)
    }
    const lineCursorProps = this.textEditManager.getLineCursorProps()
    this.gizmoManager.addOrReplace(TextLineCursor, lineCursorProps)
  }
}

export const TextLineCursor: ElementFunction = (props) => {
  return (
    <g>
      <line id="text-cursor" stroke="#0f0" {...props}></line>
    </g>
  )
}

type TextLayoutMetrics = {
  lines: string[]
  lineCount: number
  lineHeight: number
  firstLineYOffset: number
  minWidth: number
}

type CellDelta = -1 | 0 | 1
type InsertSide = "left" | "right"

/**
 * TextNavigator is responsible for maintaining state of text
 * navigation and calculating cursor positions based on the text.
 * The default position is at the end of the text
 */
export class TextEditManager {
  private readonly lineCursorWidth = 2
  private readonly position: { col: number; row: number } = { col: 0, row: 0 }
  private memorizedColumn = 0
  private insertSide: InsertSide = "right"

  constructor(private readonly docElement: TextElement) {
    this.setInitialPosition()
  }

  /**
   * Changes position value clamped for row to be within text
   * Column movement beyond the line length will move to next row
   * @param deltaCol - number of columns to move
   * @param deltaRow - number of rows to move
   */
  changePosition(deltaCol: CellDelta, deltaRow: CellDelta) {
    const metrics = this.textLayoutMetrics()
    if (deltaRow !== 0) {
      this.changeRow(deltaRow, metrics)
    }

    if (deltaCol !== 0) {
      this.changeColumn(deltaCol, metrics)
    }
  }

  private changeRow(deltaRow: CellDelta, metrics?: TextLayoutMetrics) {
    const { lines, lineCount } = metrics || this.textLayoutMetrics()
    this.position.row = clamp(this.position.row + deltaRow, 0, lineCount - 1)

    const lineLength = lines[this.position.row].length

    this.position.col = clamp(
      Math.max(this.position.col, this.memorizedColumn),
      0,
      lineLength - 1
    )
  }

  private changeColumn(deltaCol: CellDelta, metrics?: TextLayoutMetrics) {
    const { lines } = metrics || this.textLayoutMetrics()

    const nextCol = this.position.col + deltaCol
    const lineLength = lines[this.position.row].length

    this.position.col = clamp(nextCol, 0, lineLength - 1)
    this.memorizedColumn = this.position.col

    if (nextCol > lineLength - 1) {
      this.insertSide = "right"
    } else if (nextCol < 0) {
      this.insertSide = "left"
    }
  }

  getBlockCursorProps(): {
    x: number
    y: number
    width: number
    height: number
  } {
    const { lines, lineHeight, firstLineYOffset, minWidth } =
      this.textLayoutMetrics()
    const line = lines[this.position.row]
    const textMetrics = getTextMetrics(line)
    const textWidth = textMetrics.width
    const height =
      textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent

    const colLeftBound = this.position.col
      ? getTextWidth(line.slice(0, this.position.col))
      : 0
    const colRightBound = getTextWidth(line.slice(0, this.position.col + 1))
    const width =
      colRightBound - colLeftBound ? colRightBound - colLeftBound : minWidth
    return {
      x:
        this.docElement.position.x +
        this.docElement.props.textProps.x -
        textWidth / 2 +
        colLeftBound,
      y:
        this.docElement.position.y +
        this.docElement.props.textProps.y -
        height / 2 +
        firstLineYOffset +
        this.position.row * lineHeight,
      width,
      height,
    }
  }

  getLineCursorProps() {
    const { lines, lineHeight, firstLineYOffset } = this.textLayoutMetrics()
    const line = lines[this.position.row]
    const textMetrics = getTextMetrics(line)
    const textWidth = textMetrics.width
    const height =
      textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent

    const boundCol =
      this.insertSide === "left" ? this.position.col : this.position.col + 1
    const leftBound = boundCol ? getTextWidth(line.slice(0, boundCol)) : 0

    const x =
      this.docElement.position.x +
      this.docElement.props.textProps.x -
      textWidth / 2 +
      leftBound
    const y1 =
      this.docElement.position.y +
      this.docElement.props.textProps.y -
      height / 2 +
      firstLineYOffset +
      this.position.row * lineHeight

    return {
      x1: x,
      x2: x,
      y1,
      y2: y1 + height,
      "stroke-width": this.lineCursorWidth,
    }
  }

  setInsertSide(side: InsertSide) {
    this.insertSide = side
  }

  private setInitialPosition() {
    const { lines, lineCount } = this.textLayoutMetrics()
    this.position.row = lineCount - 1
    this.position.col = lines[this.position.row].length - 1
    this.memorizedColumn = this.position.col
  }

  private textLayoutMetrics(): TextLayoutMetrics {
    const spaceWidth = getTextWidth(" ")
    const lines = this.getLines()
    const lineCount = lines.length

    const lineHeight = this.docElement.props.textProps.lineHeight || 1.2 * 16 // FIXME: 16 is the default font size
    const totalHeight = (lineCount - 1) * lineHeight
    const firstLineYOffset = -1 * (totalHeight / 2)

    return {
      lines,
      lineCount,
      lineHeight,
      firstLineYOffset,
      minWidth: spaceWidth,
    }
  }

  private getLines(textSlice?: string) {
    const text = textSlice ? textSlice : this.docElement.props.text
    const rows = text.split("\n")
    const maxWidth = this.docElement.maxWidth
    const spaceWidth = getTextWidth(" ")

    const lines = rows
      .map((row) => {
        const words = row.split(" ")
        return this.wrapLines(words, maxWidth, spaceWidth)
      })
      .flat()

    return lines
  }

  private wrapLines(words: string[], maxWidth: number, spaceWidth: number) {
    const lines: string[] = []
    let currentIndex = 0
    for (const word of words) {
      const wordWidth = getTextWidth(word)
      const line = lines[currentIndex] || ""

      if (line.length === 0) {
        lines[currentIndex] = word
      } else {
        const totalWidth = getTextWidth(line) + spaceWidth + wordWidth
        if (totalWidth >= maxWidth) {
          lines[++currentIndex] = word
        } else {
          lines[currentIndex] += ` ${word}`
        }
      }
    }
    return lines
  }

  getInsertIndex() {
    const lines = this.getLines()
    let indexRowOffset = 0
    for (let i = 0; i < this.position.row; i++) {
      indexRowOffset += lines[i].length + 1
    }
    const indexSideOffset = this.insertSide === "left" ? 0 : 1
    const index = indexRowOffset + this.position.col + indexSideOffset

    return index
  }

  updateOnKeyType(key: string) {
    switch (key) {
      case "\n":
        this.position.row += 1
        this.position.col = 0
        this.memorizedColumn = 0
        break
      default:
        this.changeColumnFluid(1)
    }
  }

  private changeColumnFluid(deltaCol: CellDelta) {
    // const lines = this.getLines()
    const targetIndex = this.getInsertIndex() + deltaCol
    // const insertSideOffset = this.insertSide === "left" ? 0 : 1

    const textUpToIndex = this.docElement.props.text.slice(0, targetIndex)
    // const currentIndex = textUpToIndex.length
    const linesUpToIndex = this.getLines(textUpToIndex)
    const row = linesUpToIndex.length - 1
    // let row = 0
    // let currentIndex = 0
    // for (let i = 0; i < lines.length; i++) {
    //   const nextIndex = currentIndex + lines[i].length
    //   if (nextIndex <= targetIndex) {
    //     currentIndex = nextIndex + 1
    //     row = i
    //   } else {
    //     currentIndex -= 1
    //     break
    //   }
    // }

    const col = linesUpToIndex[row].length - 1
    // let col = 0
    // if (targetIndex - currentIndex - insertSideOffset > 0) {
    //   col = targetIndex - currentIndex - insertSideOffset
    // } else {
    //   col = this.insertSide === "left" ? 0 : lines[row].length - 1
    // }

    this.position.row = row
    this.position.col = col
    this.memorizedColumn = this.position.col
  }
}
