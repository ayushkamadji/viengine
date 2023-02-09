const canvas = document.createElement("canvas")
const context = canvas.getContext("2d")!
export const bodyFont = getComputedStyle(document.body).font
context.font = bodyFont

window["tempLib"] = { getTextWidth }

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
