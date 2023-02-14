// const WORD_REGEX = /(\S+)(\s*)/g
const LINE_REGEX = /((.*\n)|(.+$)|(^$))/g
const FONT_SIZE_REGEX = /(\d+)/g

const canvas = document.createElement("canvas")
const context = canvas.getContext("2d")!
const bodyStyle = getComputedStyle(document.body)
export const bodyFont = bodyStyle.font
context.font = bodyFont
export const fontSize = Number(bodyStyle.fontSize.match(FONT_SIZE_REGEX)![0])

export const ZERO_WIDTH_SPACE = "\u200b"
export const NON_BREAKING_SPACE = "\u00a0"

export function getTextWidth(text: string, font?: string): number {
  const tempFont = context.font
  if (font) context.font = font

  const width = context.measureText(text).width

  context.font = tempFont

  return width
}

export function getTextMetrics(text: string, font?: string): TextMetrics {
  const tempFont = context.font
  if (font) context.font = font

  const metrics = context.measureText(text)

  context.font = tempFont

  return metrics
}

export class TextEditorUtil {
  private static context2d = context

  static getLines(text: string, _maxWidth?: number, _font?: string) {
    return this.getLineRows(text)
  }

  private static getLineRows(text: string) {
    const escapedText = text.replace(/ /g, NON_BREAKING_SPACE)
    const lines: string[] = escapedText.match(LINE_REGEX) || []

    // TODO: is there a better way? We cannot use lookbehind because of WebKit
    const lastLine = lines[lines.length - 1]
    if (lastLine[lastLine.length - 1] === "\n") {
      lines.push("")
    }

    const escapedLines = lines.map((line) =>
      line.replace(/\n/g, ZERO_WIDTH_SPACE)
    )
    return escapedLines
  }

  static getLineDYOffset(
    lineIndex: number,
    totalLines: number,
    lineHeight: number
  ) {
    // Vertical middle aligned text
    const totalHeight = (totalLines - 1) * lineHeight
    const firstOffset = -1 * (totalHeight / 2)

    return lineIndex ? lineHeight : firstOffset
  }

  static getLineYOffset(
    lineIndex: number,
    totalLines: number,
    lineHeight: number
  ) {
    // Vertical middle aligned text
    const totalHeight = (totalLines - 1) * lineHeight
    const firstOffset = -1 * (totalHeight / 2)

    return lineIndex ? firstOffset + lineHeight * lineIndex : firstOffset
  }

  static getTextWidth(text: string, font?: string) {
    const tempFont = this.context2d.font
    if (font) this.context2d.font = font

    const width = this.context2d.measureText(text).width

    context.font = tempFont

    return width
  }
}
