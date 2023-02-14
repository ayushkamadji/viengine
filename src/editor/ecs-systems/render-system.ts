import { CanvasElementBuilder, CanvasRenderer } from "../../lib/canvas-renderer"
import { UIElementBuilder, UIRenderer } from "../../lib/ui-renderer"
import {
  ComponentClass,
  EntityManager,
  ManagedSystem,
} from "../ecs/entity-component-system"
import {
  ElementFunction,
  RendererComponentElementUtil,
} from "./renderer-element"

export type RendererComponentElement = {
  name: string
  id: string
  classes: string[]
  attributes: Map<string, string | number>
  children?: (RendererComponentElement | string)[]
  x: number
  y: number
}

const excludedAttributes = ["id", "className", "data-x", "data-y", "children"]

export class RendererComponent {
  private _element: RendererComponentElement | undefined

  constructor(
    private readonly factory: ElementFunction,
    private props: any = {}
  ) {}

  get element(): RendererComponentElement {
    if (!this._element) {
      this._element = RendererComponentElementUtil.extractRendererComponent(
        this.factory(this.props)
      )
    }
    return this._element
  }

  setProps(props: any) {
    this.props = { ...this.props, ...props }
    this._element = undefined
  }
}

export class UIRendererComponent extends RendererComponent {}

export class UIRendererSystem implements ManagedSystem {
  protected requiredComponents: ComponentClass[] = [UIRendererComponent]

  constructor(
    protected entityManager: EntityManager,
    protected uiRenderer: UIRenderer
  ) {}

  update(): void {
    this.uiRenderer.clear()

    const entities = this.entityManager.getEntitiesWithComponents(
      this.requiredComponents
    )

    for (const entity of entities) {
      const container = this.entityManager.getEntityComponentContainer(entity)
      const component: UIRendererComponent = container.get(UIRendererComponent)
      const elementBuilder = this.buildElement(component)

      this.uiRenderer.addElement(elementBuilder)
    }

    this.uiRenderer.render()
  }

  protected buildElement(component: UIRendererComponent) {
    const elementBuilder = this.uiRenderer
      .getElementBuilder()
      .withClasses(component.element.classes)
      .withID(component.element.id)
      .withX(component.element.x)
      .withY(component.element.y)

    if (component.element.attributes) {
      this.addAttributes(elementBuilder, component.element.attributes)
    }

    if (component.element.children) {
      this.buildElementChildren(elementBuilder, component.element.children)
    }

    return elementBuilder.build()
  }

  protected addAttributes(
    elementBuilder: UIElementBuilder,
    attributes: Map<string, string | number>
  ) {
    // TODO: to use for of without object entries we will need to specify
    // attribute as Map in vijsx which requires we transpile it in monorepo mode
    // (this will be done in the future [feat(vijsx-ts)], not atm)
    for (const [key, value] of Object.entries(attributes)) {
      if (!excludedAttributes.includes(key)) {
        elementBuilder.withAttribute(key, value)
      }
    }
  }

  protected buildElementChildren(
    parentBuilder: UIElementBuilder,
    children: (RendererComponentElement | string)[]
  ) {
    for (const child of children) {
      if (typeof child === "string") {
        parentBuilder.withChild(child)
      } else {
        const childBuilder = this.uiRenderer
          .getElementBuilder()
          .withClasses(child.classes)
          .withID(child.id)

        if (child.children) {
          this.buildElementChildren(childBuilder, child.children)
        }

        parentBuilder.withChild(childBuilder.build())
      }
    }
  }
}

export class StaticUIRendererComponent extends UIRendererComponent {}

export class StaticUIRendererSystem extends UIRendererSystem {
  protected requiredComponents: ComponentClass[] = [StaticUIRendererComponent]

  update(): void {
    this.uiRenderer.clearStaticElements()
    const entities = this.entityManager.getEntitiesWithComponents(
      this.requiredComponents
    )

    for (const entity of entities) {
      const container = this.entityManager.getEntityComponentContainer(entity)
      const component: StaticUIRendererComponent = container.get(
        StaticUIRendererComponent
      )

      const elementBuilder = this.buildElement(component)

      this.uiRenderer.addStaticElement(elementBuilder)
    }
  }
}

export class CanvasRendererComponent extends RendererComponent {}

export class CanvasRendererSystem implements ManagedSystem {
  static requiredComponents: ComponentClass[] = [CanvasRendererComponent]

  constructor(
    private entityManager: EntityManager,
    private canvasRenderer: CanvasRenderer
  ) {}

  update(): void {
    this.canvasRenderer.clear()

    const entities = this.entityManager.getEntitiesWithComponents(
      CanvasRendererSystem.requiredComponents
    )

    for (const entity of entities) {
      const container = this.entityManager.getEntityComponentContainer(entity)
      const component: CanvasRendererComponent = container.get(
        CanvasRendererComponent
      )

      const elementBuilder = this.buildElement(component)

      this.canvasRenderer.addElement(elementBuilder.build())
    }

    this.canvasRenderer.render()
  }

  private buildElement(component: CanvasRendererComponent) {
    const elementBuilder = this.canvasRenderer
      .getElementBuilder()
      .withElementName(component.element.name)
      .withID(component.element.id)
      .withClasses(component.element.classes)

    if (component.element.attributes) {
      this.addAttributes(elementBuilder, component.element.attributes)
    }

    if (component.element.children) {
      this.buildElementChildren(elementBuilder, component.element.children)
    }

    return elementBuilder
  }

  private addAttributes(
    elementBuilder: CanvasElementBuilder,
    attributes: Map<string, string | number>
  ) {
    for (const [key, value] of Object.entries(attributes)) {
      if (!excludedAttributes.includes(key)) {
        elementBuilder.withAttribute(key, value)
      }
    }
  }

  private buildElementChildren(
    parentBuilder: CanvasElementBuilder,
    children: (RendererComponentElement | string)[]
  ) {
    for (const child of children) {
      if (typeof child === "string") {
        parentBuilder.withChild(child)
      } else {
        const childBuilder = this.canvasRenderer
          .getElementBuilder()
          .withElementName(child.name)
          .withID(child.id)
          .withClasses(child.classes)

        if (child.attributes) {
          this.addAttributes(childBuilder, child.attributes)
        }

        if (child.children) {
          this.buildElementChildren(childBuilder, child.children)
        }

        parentBuilder.withChild(childBuilder.build())
      }
    }
  }
}
