import { CanvasRenderer } from "./canvas-renderer"

export interface DocumentUtil {
  getDocument(): Document
  createSVGDocument(canvasRenderer: CanvasRenderer): string | null
}

export class BrowserDocumentUtil implements DocumentUtil {
  constructor(private readonly document: Document) {}

  getDocument(): Document {
    return this.document
  }

  createSVGDocument(canvasRenderer: CanvasRenderer): string | null {
    const svgElement = canvasRenderer.getRootSVGElement()

    if (svgElement) {
      const svgClone = svgElement.cloneNode(true) as SVGElement
      const svgDocType = this.document.implementation.createDocumentType(
        "svg",
        "-//W3C//DTD SVG 1.1//EN",
        "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"
      )
      const svgDoc = document.implementation.createDocument(
        "http://www.w3.org/2000/svg",
        "svg",
        svgDocType
      )
      svgDoc.replaceChild(svgClone, svgDoc.documentElement)

      return new XMLSerializer().serializeToString(svgDoc)
    }

    return null
  }
}
