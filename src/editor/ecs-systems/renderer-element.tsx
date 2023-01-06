import { SVGProps } from "react"
import { RendererComponentElement } from "./render-system"

export type ElementFunction = (...args: any[]) => JSX.Element

export type SVGElementFunction<T extends SVGElement> = (
  props: SVGProps<T>
) => JSX.Element

export type BaseUIPropType = {
  x: number
  y: number
}

export class RendererComponentElementUtil {
  static extractRendererComponent(
    element: JSX.Element
  ): RendererComponentElement {
    const { name, id, classes, attributes, children, x, y } = element.props
    const component: RendererComponentElement = {
      name,
      id,
      classes,
      attributes,
      x,
      y,
    }

    if (children) {
      component.children = []
      if (Array.isArray(children)) {
        for (const child of children.flat()) {
          component.children.push(
            RendererComponentElementUtil.convertChild(child)
          )
        }
      } else {
        component.children.push(
          RendererComponentElementUtil.convertChild(children)
        )
      }
    }

    return component
  }

  static convertChild(child: string | JSX.Element) {
    if (typeof child === "string") {
      return child
    } else {
      return RendererComponentElementUtil.extractRendererComponent(child)
    }
  }
}
