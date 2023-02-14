import { CanvasRenderer } from "../lib/canvas-renderer"
import { Event } from "../lib/event"
import { Layer } from "../lib/layer"
import { UIRenderer } from "../lib/ui-renderer"
import { ContextNavigator } from "./context/context-navigator"
import "./editor.css"
import { RootContext } from "./context/root-context"
import { Entity, EntityManager } from "./ecs/entity-component-system"
import {
  CanvasRendererSystem,
  StaticUIRendererComponent,
  StaticUIRendererSystem,
  UIRendererComponent,
  UIRendererSystem,
} from "./ecs-systems/render-system"
import { Cursor, GridPoint, Hints } from "./editor-components"
import { EditorService } from "./editor-service"
import { ElementFactoryRegistry } from "./shapes/shape-factory"
import { TextBoxFactory, TextBoxNode } from "./shapes/text-box-factory"
import { Document, StemElement } from "./vieditor-element"
import { LineNode, LineNodeFactory } from "./shapes/line-factory"
import { HighlightParams, SelectorSystem } from "./ecs-systems/selector-system"
import { Line } from "../lib/util/geometry"
import { SystemUtil } from "../lib/system-util"
import { DocumentUtil } from "../lib/document-util"
import { WindowResizeEvent } from "../lib/window-event"

export class Util {
  static cursorColRowToCanvasXY(col: number, row: number): [number, number] {
    const x =
      (col + 1) * EditorLayer.GRID_GAP -
      (EditorLayer.CURSOR_SIZE - EditorLayer.GRID_DOT_SIZE) / 2
    const y =
      (row + 1) * EditorLayer.GRID_GAP -
      (EditorLayer.CURSOR_SIZE - EditorLayer.GRID_DOT_SIZE) / 2
    return [x, y]
  }
  static cursorCanvasXYToColRow(
    x: number,
    y: number
  ): { col: number; row: number } {
    const col = Math.round(
      (x + (EditorLayer.CURSOR_SIZE - EditorLayer.GRID_DOT_SIZE) / 2) /
        EditorLayer.GRID_GAP -
        1
    )
    const row = Math.round(
      (y + (EditorLayer.CURSOR_SIZE - EditorLayer.GRID_DOT_SIZE) / 2) /
        EditorLayer.GRID_GAP -
        1
    )
    return { col, row }
  }
}

export type Cursor = {
  col: number
  row: number
}

export class UI {
  cursor: Cursor = { col: 0, row: 0 }
  private cursorMotionCallback: (motion: Line) => void = () => {}

  hints: { items: [string, string][]; minimize: boolean } = {
    items: [],
    minimize: false,
  }

  setCursorPosition(col: number, row: number) {
    const motion: Line = this.getCursorMotion(col, row)
    this.adjustCursorPosition(col, row)
    this.cursorMotionCallback(motion)
  }

  adjustCursorPosition(col: number, row: number) {
    this.cursor.col = col
    this.cursor.row = row
  }

  private getCursorMotion(col: number, row: number): Line {
    const [x1, y1] = Util.cursorColRowToCanvasXY(
      this.cursor.col,
      this.cursor.row
    )
    const [x2, y2] = Util.cursorColRowToCanvasXY(col, row)

    return { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } }
  }

  setCursorMotionCallback(callback: (motion: Line) => void) {
    this.cursorMotionCallback = callback
  }
}

export class Canvas {
  document: Document = new Document()
  constructor() {}

  findElementByEntity(entity: Entity): StemElement | undefined {
    return this.document.findElementByEntity(entity)
  }
}

export class Clipboard {
  private elementStack: StemElement[] = []

  push(element: StemElement) {
    this.elementStack.push(element)
  }

  peek(): StemElement | undefined {
    return this.elementStack[this.elementStack.length - 1]
  }
}

export class EditorLayer implements Layer {
  static GRID_GAP = 40
  static CURSOR_SIZE = 6
  static RECT_SIZE = 30
  static GRID_DOT_SIZE = 2
  private contextNavigator: ContextNavigator
  private ui: UI = new UI()
  private canvas: Canvas = new Canvas()
  private entityManager: EntityManager
  private uiRendererSystem: UIRendererSystem
  private staticUIRendererSystem: StaticUIRendererSystem
  private canvasRendererSystem: CanvasRendererSystem
  private editorService: EditorService
  private factoryRegistry: ElementFactoryRegistry
  private selectorSystem: SelectorSystem
  private rootContext: RootContext
  private clipboard: Clipboard = new Clipboard()

  constructor(
    private readonly uiRenderer: UIRenderer,
    private readonly canvasRenderer: CanvasRenderer,
    private readonly systemUtil: SystemUtil,
    private readonly documentUtil: DocumentUtil
  ) {
    this.contextNavigator = new ContextNavigator()
    this.entityManager = new EntityManager()

    this.uiRendererSystem = new UIRendererSystem(
      this.entityManager,
      this.uiRenderer
    )

    this.staticUIRendererSystem = new StaticUIRendererSystem(
      this.entityManager,
      this.uiRenderer
    )

    this.canvasRendererSystem = new CanvasRendererSystem(
      this.entityManager,
      this.canvasRenderer
    )

    this.selectorSystem = new SelectorSystem(this.entityManager)
    this.ui.setCursorMotionCallback((motion: Line) =>
      this.selectorSystem.update(motion)
    )

    const cursorEntity = this.entityManager.createEntity()
    const highlighterEntity = this.entityManager.createEntity()
    const hintsEntity = this.entityManager.createEntity()

    this.editorService = new EditorService(
      this.entityManager,
      this.contextNavigator,
      cursorEntity, //TODO: move to ui entities to ui object
      this.ui,
      this.canvas,
      highlighterEntity,
      hintsEntity,
      this.systemUtil,
      this.documentUtil,
      this.canvasRenderer,
      this.clipboard
    )

    this.factoryRegistry = this.editorService.getFactoryRegistry()

    this.factoryRegistry.registerFactory(TextBoxNode, TextBoxFactory)
    this.factoryRegistry.registerFactory(LineNode, LineNodeFactory)

    this.addUIGrid(this.uiRenderer.getSize())
    this.staticUIRendererSystem.update()

    this.addCursor(cursorEntity)
    this.addHintsUI(hintsEntity)

    this.rootContext = new RootContext(this.editorService, this.factoryRegistry)
    this.contextNavigator.registerContext("root", this.rootContext)
    this.editorService.navigateTo("root")

    this.selectorSystem.setHighlightCallback(this.onHighlight.bind(this))

    this.render()
  }

  async onEvent(event: Event): Promise<void> {
    const context = this.contextNavigator.getCurrentContext()
    try {
      await context.onEvent(event)

      if (event instanceof WindowResizeEvent) {
        this.onWindowResize(event)
      }
    } catch (_e) {
      //TODO: handle event handling error
    } finally {
      this.render()
    }
  }

  private onWindowResize(_event: WindowResizeEvent) {
    const entities = this.entityManager.getEntitiesWithComponents([
      StaticUIRendererComponent,
    ])
    entities.forEach((entity) => {
      this.entityManager.removeEntity(entity)
    })
    const { width, height } = this.uiRenderer.getSize()
    this.addUIGrid({ width, height })
    this.staticUIRendererSystem.update()
  }

  private getStaticEntities() {
    return this.entityManager.getEntitiesWithComponents([
      StaticUIRendererComponent,
    ])
  }

  private render() {
    this.renderCanvas()
    this.renderUI()
  }

  private renderCanvas() {
    this.canvasRendererSystem.update()
  }

  private renderUI() {
    this.uiRendererSystem.update()
  }

  private addCursor(entity: Entity) {
    const { col, row } = this.ui.cursor
    const [x, y] = Util.cursorColRowToCanvasXY(col, row)
    const uiRendererComponent = new UIRendererComponent(Cursor, {
      x,
      y,
      hidden: false,
    })
    this.entityManager.addComponent(entity, uiRendererComponent)
  }

  private addUIGrid({ width, height }) {
    const maxColumns = Math.ceil(width / EditorLayer.GRID_GAP)
    const maxRows = Math.ceil(height / EditorLayer.GRID_GAP)
    for (let i = 1; i < maxColumns; i++) {
      for (let j = 1; j < maxRows; j++) {
        const x = i * EditorLayer.GRID_GAP
        const y = j * EditorLayer.GRID_GAP
        const index = (i - 1) * maxRows + j
        const uiEntity = this.entityManager.createEntity()
        const uiRendererComponent = new StaticUIRendererComponent(GridPoint, {
          x,
          y,
          index,
        })
        this.entityManager.addComponent(uiEntity, uiRendererComponent)
      }
    }
  }

  private addHintsUI(entity: Entity) {
    const uiRendererComponent = new UIRendererComponent(Hints, this.ui.hints)
    this.entityManager.addComponent(entity, uiRendererComponent)
  }

  private onHighlight(entity: Entity, params: HighlightParams) {
    this.rootContext.onHighlight(entity, params)
  }
}
