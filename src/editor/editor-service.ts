import { Entity, EntityManager } from "./ecs/entity-component-system"
import {
  CanvasRendererComponent,
  UIRendererComponent,
} from "./ecs-systems/render-system"
import { ElementFunction } from "./ecs-systems/renderer-element"
import { UI, Canvas, Util } from "./editor"
import { Document, StemElement } from "./vieditor-element"

export class EditorService {
  constructor(
    readonly document: Document,
    private readonly entityManager: EntityManager,
    private readonly cursorEntity: Entity,
    private readonly ui: UI,
    private readonly canvas: Canvas
  ) {}

  generateEntity(): number {
    return this.entityManager.createEntity()
  }

  getCursorEntity(): Entity {
    return this.cursorEntity
  }

  setCursorPosition(col: number, row: number) {
    this.ui.setCursorPosition(col, row)
    const rendererComponent: UIRendererComponent =
      this.getCursorEntityComponentContainer()

    const [x, y] = Util.cursorColRowToCanvasXY(col, row)
    rendererComponent.setProps({ x, y })
  }

  getCursorPosition(): { col: number; row: number } {
    return this.ui.cursor
  }

  addElementAtCursor(element: StemElement) {
    this.canvas.document.addElement(element)

    const [x, y] = this.getCursorXY()
    element.setPosition(x, y)

    if (element.jsxElementFunction) {
      const entity: Entity = element.entityID

      const canvasRendererComponent: CanvasRendererComponent =
        new CanvasRendererComponent(element.jsxElementFunction, element.props)

      this.entityManager.addComponent(entity, canvasRendererComponent)
    }
  }

  removeElement(element: StemElement) {
    this.canvas.document.removeElement(element)
    this.entityManager.removeEntity(element.entityID)
  }

  private getCursorXY() {
    return Util.cursorColRowToCanvasXY(this.ui.cursor.col, this.ui.cursor.row)
  }

  addUIAtCursor(entity: Entity, elementFunction: ElementFunction, props: any) {
    const [x, y] = this.getCursorXY()
    const rendererComponent = new UIRendererComponent(elementFunction, {
      x,
      y,
      ...props,
    })
    this.entityManager.addComponent(entity, rendererComponent)
  }

  removeEntity(entity: Entity) {
    this.entityManager.removeEntity(entity)
  }

  hideMainCursor() {
    const rendererComponent: UIRendererComponent =
      this.getCursorEntityComponentContainer()

    rendererComponent.setProps({ hidden: "hidden" })
  }

  showMainCursor() {
    const rendererComponent: UIRendererComponent =
      this.getCursorEntityComponentContainer()

    rendererComponent.setProps({ hidden: "" })
  }

  setElementProps(entity: Entity, props: any) {
    const rendererComponent: CanvasRendererComponent = this.entityManager
      .getEntityComponentContainer(entity)
      .get(CanvasRendererComponent)

    rendererComponent.setProps(props)
  }

  private getCursorEntityComponentContainer(): UIRendererComponent {
    return this.entityManager
      .getEntityComponentContainer(this.cursorEntity)
      .get(UIRendererComponent)
  }
}
