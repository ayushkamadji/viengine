import { SVGNode } from "./editor-components"
import { ElementFunction } from "./ecs-systems/renderer-element"
import { SVGProps } from "react"
import { EditorLayer } from "./editor"

export interface Element {
  readonly entityID: number
  name: string
  children?: Element[]
}

export interface StemElement extends Element {
  readonly jsxElementFunction?: ElementFunction
  props: any
  setPosition(x: number, y: number): void
}

type PropsWithText = {
  text: string
}

export interface TextElement extends StemElement {
  props: PropsWithText
}

export class Node implements StemElement {
  static _jsxElementFunction = SVGNode
  name = "node"
  text = ""
  props: SVGProps<SVGRectElement> = {
    x: 0,
    y: 0,
    width: EditorLayer.RECT_SIZE,
    height: EditorLayer.RECT_SIZE,
    stroke: "white",
  }

  constructor(public entityID: number) {
    this.text = entityID.toString()
  }
  children?: Element[] | undefined

  setPosition(x: number, y: number): void {
    this.props.x = x
    this.props.y = y
  }

  get jsxElementFunction() {
    return Node._jsxElementFunction
  }
}

export class Document implements Element {
  entityID = 0
  name = "document"
  children: Element[] = []

  addElement(element: Element): void {
    this.children.push(element)
  }
}

// export default { Document, Node, TextBoxNode, Element }
