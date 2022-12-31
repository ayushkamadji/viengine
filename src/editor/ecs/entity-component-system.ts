import { CanvasRenderer } from "../../lib/canvas-renderer"
import { UIRenderer } from "../../lib/ui-renderer"

export type Entity = number

export class CanvasRendererComponent {
  constructor(
    public elementName: string,
    public elementID: string,
    public classes: string[],
    public attributes: Map<string, string | number>
  ) {}
}

export class UIRendererComponent {
  constructor(
    public elementName: string,
    public elementID: string,
    public classes: string[],
    public x: number,
    public y: number
  ) {}
}

export class SelectorComponent {
  //Note: Add layer id for multilayer support later
  constructor(
    public role: "pointer" | "selectable",
    public points: { x: number; y: number }[]
  ) {}
}

export type Component =
  | CanvasRendererComponent
  | UIRendererComponent
  | SelectorComponent

export type ComponentClass = { new (...args: any[]): Component }

export class ComponentContainer {
  private map = new Map<ComponentClass, Component>()

  add(component: Component): void {
    this.map.set(component.constructor as ComponentClass, component)
  }

  get<T extends Component, K extends ComponentClass>(componentClass: K): T {
    return this.map.get(componentClass) as T
  }

  has(componentClass: ComponentClass): boolean {
    return this.map.has(componentClass)
  }

  hasAll(componentClasses: Iterable<ComponentClass>): boolean {
    for (const cClass of componentClasses) {
      if (!this.map.has(cClass)) {
        return false
      }
    }
    return true
  }

  delete(componentClass: ComponentClass): void {
    this.map.delete(componentClass)
  }
}

export class EntityManager {
  private nextEntityID = 0
  private entities: Entity[] = []
  private entityComponents = new Map<Entity, ComponentContainer>()

  createEntity(): Entity {
    const entity = this.nextEntityID++
    this.entities.push(entity)
    return entity
  }

  addComponent(entity: Entity, component: Component): void {
    if (this.entities.includes(entity)) {
      if (!this.entityComponents.has(entity)) {
        this.entityComponents.set(entity, new ComponentContainer())
      }
      this.entityComponents.get(entity)!.add(component)
    }
  }

  removeEntity(entity: Entity): void {
    this.entities = this.entities.filter((e) => e !== entity)
    this.entityComponents.delete(entity)
  }

  getEntitiesWithComponents<K extends ComponentClass>(
    componentClasses: K[]
  ): Entity[] {
    const entities: Entity[] = []
    for (const [entity, components] of this.entityComponents) {
      if (components.hasAll(componentClasses)) {
        entities.push(entity)
      }
    }
    return entities
  }

  getEntityComponentContainer(entity: Entity): ComponentContainer {
    return this.entityComponents.get(entity)!
  }
}

export interface ManagedSystem {
  update(): void
}

export class UIRendererSystem implements ManagedSystem {
  static requiredComponents: ComponentClass[] = [UIRendererComponent]

  constructor(
    private entityManager: EntityManager,
    private uiRenderer: UIRenderer
  ) {}

  update(): void {
    this.uiRenderer.clear()

    const entities = this.entityManager.getEntitiesWithComponents(
      UIRendererSystem.requiredComponents
    )

    for (const entity of entities) {
      const container = this.entityManager.getEntityComponentContainer(entity)
      const component: UIRendererComponent = container.get(UIRendererComponent)

      const elementBuilder = this.uiRenderer
        .getElementBuilder()
        .withClasses(component.classes)
        .withID(component.elementID)
        .withX(component.x)
        .withY(component.y)
        .build()

      this.uiRenderer.addElement(elementBuilder)
    }

    this.uiRenderer.render()
  }
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
