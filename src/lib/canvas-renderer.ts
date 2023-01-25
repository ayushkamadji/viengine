const SVG_NAMESPACE_URL = "http://www.w3.org/2000/svg"

export class CanvasElementBuilder {
  private elementName = ""
  private id = ""
  private classList: string[] = []
  private attributes: Map<string, string | number> = new Map()
  private children: (SVGElement | string)[] = []

  constructor(private readonly document: Document) {}

  withElementName(name: string): CanvasElementBuilder {
    this.elementName = name

    return this
  }

  withID(id: string): CanvasElementBuilder {
    this.id = id

    return this
  }

  withClass(className: string): CanvasElementBuilder {
    this.classList.push(className)

    return this
  }

  withClasses(classNames: string[]): CanvasElementBuilder {
    this.classList.push(...classNames)

    return this
  }

  withAttribute(name: string, value: string | number): CanvasElementBuilder {
    this.attributes.set(name, value)

    return this
  }

  withAttributes(
    attributes: Map<string, string | number>
  ): CanvasElementBuilder {
    for (const [key, value] of attributes) {
      this.attributes.set(key, value)
    }

    return this
  }

  withChild(child: SVGElement | string): CanvasElementBuilder {
    this.children.push(child)

    return this
  }

  build(): SVGElement {
    const elementNS = this.document.createElementNS(
      SVG_NAMESPACE_URL,
      this.elementName
    )
    if (this.id) {
      elementNS.id = this.id
    }
    elementNS.classList.add(...this.classList)

    for (const [key, value] of this.attributes) {
      elementNS.setAttributeNS(null, key, value.toString())
    }

    for (const child of this.children) {
      if (typeof child === "string") {
        elementNS.appendChild(this.document.createTextNode(child))
      } else {
        elementNS.appendChild(child)
      }
    }

    return elementNS
  }
}

export class CanvasRenderer {
  private readonly document: Document
  private elements: SVGElement[] = []

  constructor(
    private readonly canvasRootContainer: HTMLElement,
    document: Document
  ) {
    this.canvasRootContainer.classList.add("vi-doc")
    this.document = document
  }

  getElementBuilder() {
    return new CanvasElementBuilder(this.document)
  }

  clear() {
    this.elements.length = 0 // TODO: move to array util
    while (this.canvasRootContainer.lastChild) {
      this.canvasRootContainer.removeChild(this.canvasRootContainer.lastChild)
    }
  }

  addElement(element: SVGElement) {
    this.elements.push(element)
  }

  render() {
    const svgRoot = new CanvasElementBuilder(this.document)
      .withElementName("svg")
      .withID("vi-svg-root")
      .withAttribute("width", this.document.body.clientWidth)
      .withAttribute("height", this.document.body.clientHeight)
      .build()
    for (const element of this.elements) {
      svgRoot.appendChild(element)
    }
    svgRoot.setAttribute("xlmns", SVG_NAMESPACE_URL)
    this.canvasRootContainer.appendChild(svgRoot)
  }

  getRootSVGElement(): SVGElement | null {
    return this.canvasRootContainer.querySelector("#vi-svg-root")
  }
}
