import {
  CanvasRendererComponent,
  StaticUIRendererComponent,
  UIRendererComponent,
} from "../ecs-systems/render-system"

export type Entity = number

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
  | StaticUIRendererComponent
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

  keys(): string[] {
    const keys: string[] = []
    for (const key in this.map.keys()) {
      keys.push(key)
    }
    return keys
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
