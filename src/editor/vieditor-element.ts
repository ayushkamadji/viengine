import { SVGNode } from "./editor-components"
import { ElementFunction } from "./ecs-systems/renderer-element"
import { SVGProps } from "react"
import { EditorLayer } from "./editor"

export interface Element {
  readonly entityID: number
  name: string
  children?: Element[]
}

export type Point = { x: number; y: number; z?: number }

export interface StemElement extends Element {
  readonly jsxElementFunction?: ElementFunction
  props: any
  position: Point
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
  position: Point = { x: 0, y: 0 }
  props: SVGProps<SVGRectElement> = {
    x: 0,
    y: 0,
    width: EditorLayer.RECT_SIZE,
    height: EditorLayer.RECT_SIZE,
    stroke: "white",
    transform: `translate(${this.position.x}, ${this.position.y})`,
  }

  constructor(public entityID: number) {
    this.text = entityID.toString()
  }
  children?: Element[] | undefined

  setPosition(x: number, y: number): void {
    this.props.x = x
    this.props.y = y
    this.position.x = x
    this.position.y = y
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

  removeElement(element: Element): void {
    const index = this.children.indexOf(element)
    if (index > -1) {
      this.children.splice(index, 1)
    }
  }
}

// export default { Document, Node, TextBoxNode, Element }
