import { ElementFunction } from "./ecs-systems/renderer-element"
import { Geometry } from "../lib/util/geometry"
import { Type } from "class-transformer"
import { TextBoxNode } from "./shapes/text-box-factory"
import { LineNode } from "./shapes/line-factory"

export interface Element {
  readonly entityID: number
  name: string
  children?: Element[]
}

export type Point = { x: number; y: number; z?: number }

export abstract class StemElement implements Element {
  abstract entityID: number
  abstract name: string
  abstract readonly jsxElementFunction?: ElementFunction
  abstract readonly geometryFn: () => Geometry
  abstract props: any
  abstract position: Point
  abstract setPosition(x: number, y: number): void
}

type PropsWithText = {
  text: string
  textProps: { x: number; y: number; lineHeight?: number }
}

export interface TextElement extends StemElement {
  maxWidth: number
  props: PropsWithText
}

export class Document implements Element {
  entityID = 0
  name = "document"
  @Type(() => StemElement, {
    discriminator: {
      property: "name",
      subTypes: [
        { value: TextBoxNode, name: "text-box-node" },
        { value: LineNode, name: "line-node" },
      ],
    },
  })
  children: StemElement[] = []

  addElement(element: StemElement): void {
    this.children.push(element)
  }

  removeElement(element: StemElement): void {
    const index = this.children.indexOf(element)
    if (index > -1) {
      this.children.splice(index, 1)
    }
  }
}

// export default { Document, Node, TextBoxNode, Element }
