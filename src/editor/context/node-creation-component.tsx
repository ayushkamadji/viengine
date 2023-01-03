import {
  RendererComponentElement,
  UIRendererComponent,
} from "../ecs-systems/render-system"
import "./node-creation.css"

type MenuProps = {
  x: number
  y: number
  items: string[]
}

export const Menu = ({ x, y, items }: MenuProps) => {
  return (
    <div
      id="node-create-menu"
      className="node-create-menu"
      data-x={x}
      data-y={y}
    >
      {items.map((item, i) => {
        return <div key={i}>{item}</div>
      })}
    </div>
  )
}

export type ComponentFactoryType<TProps> = {
  create(props: TProps): UIRendererComponent
}

export class MenuComponentFactory {
  private static create(props: MenuProps): UIRendererComponent {
    const element: JSX.Element = <Menu {...props} />
    const elementProps: typeof element["props"] = element.props
    const componentElement = ComponentFactory.extractRendererComponent(element)

    return new UIRendererComponent(
      componentElement,
      elementProps.x,
      elementProps.y
    )
  }

  static createFactory(items): (x, y) => UIRendererComponent {
    return (x, y) => MenuComponentFactory.create({ x, y, items })
  }
}

export class ComponentFactory {
  static extractRendererComponent(
    element: JSX.Element
  ): RendererComponentElement {
    const { name, id, classes, attributes, children } = element.props
    const component: RendererComponentElement = {
      name,
      id,
      classes,
      attributes,
    }

    if (children) {
      component.children = []
      if (Array.isArray(children)) {
        for (const child of children.flat()) {
          component.children.push(ComponentFactory.convertChild(child))
        }
      } else {
        component.children.push(ComponentFactory.convertChild(children))
      }
    }

    return component
  }

  static convertChild(child: string | JSX.Element) {
    if (typeof child === "string") {
      return child
    } else {
      return ComponentFactory.extractRendererComponent(child)
    }
  }
}
