export class UIElementBuilder {
  constructor(private readonly document: Document) {}
  private classList: string[] = []
  private xPos = 0
  private yPos = 0
  private id = ""

  withClass(className: string): UIElementBuilder {
    this.classList.push(className)

    return this
  }

  withClasses(classNames: string[]): UIElementBuilder {
    this.classList.push(...classNames)
    return this
  }

  withX(x: number): UIElementBuilder {
    this.xPos = x

    return this
  }

  withY(y: number): UIElementBuilder {
    this.yPos = y

    return this
  }

  withID(id: string): UIElementBuilder {
    this.id = id

    return this
  }

  build() {
    const element = this.document.createElement("div")
    element.classList.add(...this.classList)
    element.style.left = `${this.xPos}px`
    element.style.top = `${this.yPos}px`
    if (this.id) {
      element.id = this.id
    }
    return element
  }
}

export class UIRenderer {
  private readonly rootElement: HTMLElement
  private readonly document: Document
  private elements: HTMLElement[] = []

  constructor(rootElement: HTMLElement, document: Document) {
    this.rootElement = rootElement
    this.rootElement.classList.add("ui")
    this.document = document
  }

  getElementBuilder() {
    return new UIElementBuilder(this.document)
  }

  clear() {
    this.elements.length = 0 // TODO: move to array util
    while (this.rootElement.lastChild) {
      this.rootElement.removeChild(this.rootElement.lastChild)
    }
  }

  addElement(element: HTMLElement) {
    this.elements.push(element)
  }

  render() {
    for (const element of this.elements) {
      this.rootElement.appendChild(element)
    }
  }

  // TODO: temporary for editor to know width and height
  // should think about where to put this
  getSize() {
    return {
      width: this.document.body.clientWidth,
      height: this.document.body.clientHeight,
    }
  }
}
