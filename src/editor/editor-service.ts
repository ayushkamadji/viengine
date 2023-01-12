import { Entity, EntityManager } from "./ecs/entity-component-system"
import {
  CanvasRendererComponent,
  UIRendererComponent,
} from "./ecs-systems/render-system"
import { ElementFunction } from "./ecs-systems/renderer-element"
import { UI, Canvas, Util, EditorLayer } from "./editor"
import { Document, StemElement } from "./vieditor-element"
import { SelectorComponent } from "./ecs-systems/selector-system"
import { Geometry, isLine, isPolygon, Point } from "../lib/util/geometry"
import { ArrowDown } from "./context/root-components"
import { ContextNavigator } from "./context/context-navigator"
import {
  AbstractCommandContext,
  Context,
  ContextFactory,
} from "./context/context.interface"

export const HIGHLIGH_OFFSET = 20
export class EditorService {
  constructor(
    readonly document: Document,
    private readonly entityManager: EntityManager,
    private readonly contextNavigator: ContextNavigator,
    private readonly cursorEntity: Entity,
    private readonly ui: UI,
    private readonly canvas: Canvas,
    private readonly highlightEntity: Entity,
    private readonly hintsEntity: Entity
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
      this.getCursorRendererComponent()

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

    if (element.geometryFn) {
      this.entityManager.addComponent(
        element.entityID,
        new SelectorComponent(element.geometryFn)
      )
    }
  }

  removeElement(element: StemElement) {
    this.canvas.document.removeElement(element)
    this.entityManager.removeEntity(element.entityID)
  }

  private getCursorXY() {
    return Util.cursorColRowToCanvasXY(this.ui.cursor.col, this.ui.cursor.row)
  }

  updateUI(entity: Entity, props: any) {
    const rendererComponent: UIRendererComponent = this.entityManager
      .getEntityComponentContainer(entity)
      .get(UIRendererComponent)

    rendererComponent.setProps(props)
  }

  addUIAtCursor(entity: Entity, elementFunction: ElementFunction, props: any) {
    const [x, y] = this.getCursorXY()
    this.addUIAtXY(entity, elementFunction, { ...props, x, y })
  }

  addUIAtXY(entity: Entity, elementFunction: ElementFunction, props: any) {
    const rendererComponent = new UIRendererComponent(elementFunction, {
      ...props,
    })
    this.entityManager.addComponent(entity, rendererComponent)
  }

  removeUI(entity: Entity) {
    this.entityManager
      .getEntityComponentContainer(entity)
      .delete(UIRendererComponent)
  }

  addHighlighter(entity: Entity) {
    const selectorComponent: SelectorComponent = this.entityManager
      .getEntityComponentContainer(entity)
      .get(SelectorComponent)

    const geometry: Geometry = selectorComponent.geometry
    const points: Point[] = isPolygon(geometry)
      ? geometry
      : isLine(geometry)
      ? [geometry.p1, geometry.p2]
      : []
    const xSortedPoints = [...points].sort((a, b) => a.x - b.x)
    const yxSortedPoints = xSortedPoints.sort((a, b) => a.y - b.y)
    const { x, y } = yxSortedPoints[0]

    const rendererComponent = new UIRendererComponent(ArrowDown, {
      x,
      y: y - HIGHLIGH_OFFSET,
    })
    this.entityManager.addComponent(this.highlightEntity, rendererComponent)
  }

  removeHighlighter() {
    this.entityManager.removeComponent(
      this.highlightEntity,
      UIRendererComponent
    )
  }

  removeEntity(entity: Entity) {
    this.entityManager.removeEntity(entity)
  }

  hideMainCursor() {
    const rendererComponent: UIRendererComponent =
      this.getCursorRendererComponent()

    rendererComponent.setProps({ hidden: "hidden" })
  }

  showMainCursor() {
    const rendererComponent: UIRendererComponent =
      this.getCursorRendererComponent()

    rendererComponent.setProps({ hidden: "" })
  }

  setElementProps(entity: Entity, props: any) {
    const rendererComponent: CanvasRendererComponent = this.entityManager
      .getEntityComponentContainer(entity)
      .get(CanvasRendererComponent)

    rendererComponent.setProps(props)
  }

  private getCursorRendererComponent(): UIRendererComponent {
    return this.entityManager
      .getEntityComponentContainer(this.cursorEntity)
      .get(UIRendererComponent)
  }

  moveElement(element: StemElement, colDelta: number, rowDelta: number) {
    const { col, row } = this.ui.cursor
    const newCol = col + colDelta
    const newRow = row + rowDelta
    this.ui.adjustCursorPosition(newCol, newRow)

    const { x, y } = element.position
    element.setPosition(
      x + colDelta * EditorLayer.GRID_GAP,
      y + rowDelta * EditorLayer.GRID_GAP
    )
    this.setElementProps(element.entityID, element.props)

    const rendererComponent: UIRendererComponent =
      this.getCursorRendererComponent()
    const [cursorX, cursorY] = Util.cursorColRowToCanvasXY(newCol, newRow)
    rendererComponent.setProps({ x: cursorX, y: cursorY })
  }

  navigateToContext(context: string | Context, ...args: any[]) {
    this.contextNavigator.navigateTo(context, ...args)
    const currentContext = this.contextNavigator.getCurrentContext()
    if (currentContext instanceof AbstractCommandContext) {
      const hintItems = currentContext.getHints()
      this.ui.hints.items = hintItems
    } else {
      this.ui.hints.items = []
    }
    this.updateUI(this.hintsEntity, this.ui.hints)
  }

  registerContext(path: string, context: Context | ContextFactory) {
    this.contextNavigator.registerContext(path, context)
  }
}
