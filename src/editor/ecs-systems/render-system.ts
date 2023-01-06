import { CanvasRenderer } from "../../lib/canvas-renderer"
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

export class UIRendererComponent {
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
      // TODO: to use for of without object entries we will need to specify
      // attribute as Map in vijsx which requires we transpile it in monorepo mode
      // (this will be done in the future [feat(vijsx-ts)], not atm)
      for (const [key, value] of Object.entries(component.element.attributes)) {
        if (!excludedAttributes.includes(key)) {
          elementBuilder.withAttribute(key, value)
        }
      }
    }

    if (component.element.children) {
      this.buildElementChildren(elementBuilder, component.element.children)
    }

    return elementBuilder.build()
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

export class CanvasRendererComponent {
  constructor(
    public elementName: string,
    public elementID: string,
    public classes: string[],
    public attributes: Map<string, string | number>
  ) {}
}

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

      const elementBuilder = this.canvasRenderer
        .getElementBuilder()
        .withElementName(component.elementName)
        .withID(component.elementID)
        .withAttributes(component.attributes)
        .build()

      this.canvasRenderer.addElement(elementBuilder)
    }

    this.canvasRenderer.render()
  }
}
