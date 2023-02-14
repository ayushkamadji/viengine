export class UIElementBuilder {
  constructor(private readonly document: Document) {}
  private classList: string[] = []
  private xPos: number | undefined
  private yPos: number | undefined
  private id = ""
  private children: (HTMLElement | string)[] = []
  private tag = "div"
  private attributes: Map<string, string | number> = new Map()

  withTag(tag: string): UIElementBuilder {
    this.tag = tag

    return this
  }

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

  withChildren(children: HTMLElement[]): UIElementBuilder {
    this.children = children

    return this
  }

  withChild(child: HTMLElement | string): UIElementBuilder {
    this.children.push(child)

    return this
  }

  withAttribute(key: string, value: string | number) {
    this.attributes.set(key, value)

    return this
  }

  build(): HTMLElement {
    const element = this.document.createElement("div")

    if (this.classList.length > 0) {
      element.classList.add(...this.classList)
    }

    if (this.xPos !== undefined && this.yPos) {
      element.style.left = `${this.xPos}px`
      element.style.top = `${this.yPos}px`
    }

    if (this.id) {
      element.id = this.id
    }

    if (this.attributes.size > 0) {
      for (const [key, value] of this.attributes) {
        if (value && value.toString instanceof Function) {
          element.setAttribute(key, value.toString())
        }
      }
    }

    this.children.forEach((child) => {
      if (typeof child === "string") {
        const textNode = this.document.createTextNode(child)
        element.appendChild(textNode)
      } else {
        element.appendChild(child)
      }
    })

    return element
  }
}

export class UIRenderer {
  private readonly rootElement: HTMLElement
  private readonly staticRootElement: HTMLElement
  private readonly document: Document
  private elements: HTMLElement[] = []
  private staticElements: HTMLElement[] = []

  constructor(rootElement: HTMLElement, document: Document) {
    this.rootElement = rootElement
    this.rootElement.classList.add("ui")
    this.staticRootElement = document.createElement("div")
    this.staticRootElement.id = "static-ui"
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
    this.rootElement.appendChild(this.staticRootElement)
  }

  addElement(element: HTMLElement) {
    this.elements.push(element)
  }

  addStaticElement(element: HTMLElement) {
    this.staticElements.push(element)
    this.staticRootElement.appendChild(element)
  }

  clearStaticElements() {
    this.staticElements.length = 0
    while (this.staticRootElement.lastChild) {
      this.staticRootElement.removeChild(this.staticRootElement.lastChild)
    }
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
