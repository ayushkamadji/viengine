import {
  ComponentClass,
  Entity,
  EntityManager,
} from "./ecs/entity-component-system"
import {
  CanvasRendererComponent,
  UIRendererComponent,
} from "./ecs-systems/render-system"
import { ElementFunction } from "./ecs-systems/renderer-element"
import { UI, Canvas, Util, EditorLayer, Clipboard } from "./editor"
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
import { instanceToPlain, plainToInstance } from "class-transformer"
import { ElementClass, ElementFactoryRegistry } from "./shapes/shape-factory"
import { DialogFilter, SystemUtil } from "../lib/system-util"
import { DocumentUtil } from "../lib/document-util"
import { CanvasRenderer } from "../lib/canvas-renderer"
import { cloneDeep } from "lodash"

export const HIGHLIGH_OFFSET = 20
export const VICALC_FILE_FILTER: DialogFilter = {
  extensions: ["vc", "vg"],
  name: "ViCalc",
}

const SVG_FILE_FILTER: DialogFilter = {
  extensions: ["svg"],
  name: "SVG",
}

export class EditorService {
  private readonly factoryRegistry: ElementFactoryRegistry
  constructor(
    private readonly entityManager: EntityManager,
    private readonly contextNavigator: ContextNavigator,
    private readonly cursorEntity: Entity,
    private readonly ui: UI,
    private readonly canvas: Canvas,
    private readonly highlightEntity: Entity,
    private readonly hintsEntity: Entity,
    private readonly systemUtil: SystemUtil,
    private readonly documentUtil: DocumentUtil,
    private readonly canvasRenderer: CanvasRenderer,
    private readonly clipboard: Clipboard
  ) {
    this.factoryRegistry = new ElementFactoryRegistry(this) // FIXME: circular dep
  }

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
    const [x, y] = this.getCursorXY()
    element.setPosition(x, y)

    this.addElement(element)
  }

  addElement(element: StemElement) {
    this.canvas.document.addElement(element)

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

  addHighlighter(
    entity: Entity,
    highlighterFunction: ElementFunction = ArrowDown
  ) {
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

    const rendererComponent = new UIRendererComponent(highlighterFunction, {
      x,
      y: y - HIGHLIGH_OFFSET,
    })
    this.entityManager.addComponent(this.highlightEntity, rendererComponent)
  }

  private moveHighlighter(x: number, y: number) {
    const rendererComponent: UIRendererComponent =
      this.getHighlighterRendererComponent()

    rendererComponent.setProps({ x, y: y - HIGHLIGH_OFFSET })
  }

  private getHighlighterRendererComponent(): UIRendererComponent {
    return this.entityManager
      .getEntityComponentContainer(this.highlightEntity)
      .get(UIRendererComponent)
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

  setElementCanvasProps(entity: Entity, props: any) {
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
    const rendererComponent: UIRendererComponent =
      this.getCursorRendererComponent()
    const [cursorX, cursorY] = Util.cursorColRowToCanvasXY(newCol, newRow)
    rendererComponent.setProps({ x: cursorX, y: cursorY })

    const { x, y } = element.position
    const newPosX = x + colDelta * EditorLayer.GRID_GAP
    const newPosY = y + rowDelta * EditorLayer.GRID_GAP
    element.setPosition(newPosX, newPosY)
    this.setElementCanvasProps(element.entityID, element.props)
  }

  navigateTo(context: string | Context, ...args: any[]) {
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

  removeContext(path: string) {
    this.contextNavigator.removeContext(path)
  }

  toggleHints() {
    this.ui.hints.minimize = !this.ui.hints.minimize
    this.updateUI(this.hintsEntity, this.ui.hints)
  }

  private serializeDocument() {
    const plainObj = instanceToPlain(this.canvas.document, {
      excludePrefixes: ["geometryFn", "jsxElementFunction"],
    })
    return JSON.stringify(plainObj)
  }

  async saveDoc() {
    const filename = await this.systemUtil.saveFileDialog([VICALC_FILE_FILTER])
    if (typeof filename === "string") {
      const docJson = this.serializeDocument()
      await this.systemUtil.writeFile(filename, docJson)
    }
  }

  async loadDoc() {
    const filename = await this.systemUtil.openFileDialog([VICALC_FILE_FILTER])
    console.log(filename)

    if (typeof filename === "string") {
      const contents = await this.systemUtil.readFile(filename)
      const savedDoc = plainToInstance(Document, JSON.parse(contents))

      for (const childElement of savedDoc.children) {
        this.__loadElement(childElement)
      }
    }
  }

  private __loadElement(element: StemElement) {
    const elementCtor = element.constructor as ElementClass
    const factory = this.factoryRegistry.getFactory(elementCtor)
    if (factory) {
      factory.load(element)
    }
  }

  getFactoryRegistry() {
    return this.factoryRegistry
  }

  async exportSVG(): Promise<void> {
    const svgDocString = this.documentUtil.createSVGDocument(
      this.canvasRenderer
    )

    if (svgDocString) {
      const filename = await this.systemUtil.saveFileDialog([SVG_FILE_FILTER])
      if (typeof filename === "string") {
        await this.systemUtil.writeFile(filename, svgDocString)
      }
    }
  }

  addGizmo(entity: Entity, elementFn: ElementFunction, props: any) {
    const canvasRendererComponent = new CanvasRendererComponent(
      elementFn,
      props
    )
    this.entityManager.addComponent(entity, canvasRendererComponent)
  }

  replaceGizmo(entity: Entity, elementFn: ElementFunction, props: any) {
    this.entityManager.removeComponent(entity, CanvasRendererComponent)
    this.addGizmo(entity, elementFn, props)
  }

  removeGizmo(entity: Entity) {
    this.removeComponent(entity, CanvasRendererComponent)
  }

  removeComponent(entity: Entity, component: ComponentClass) {
    this.entityManager.removeComponent(entity, component)
  }

  copyElement(entity: Entity) {
    const element = this.canvas.findElementByEntity(entity)

    if (element) {
      const clone = cloneDeep(element)
      this.clipboard.push(clone)
    }
  }

  cutElement(entity: Entity) {
    this.copyElement(entity)
    this.removeEntity(entity)
    this.canvas.document.removeElementByEntity(entity)
  }

  pasteElement() {
    const element = this.clipboard.peek()

    if (element) {
      const factory = this.factoryRegistry.getFactory(
        element.constructor as ElementClass
      )
      const [x, y] = this.getCursorXY()
      factory?.duplicate(element, { x, y })
    }
  }
}
