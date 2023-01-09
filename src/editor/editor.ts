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
import { Cursor, GridPoint } from "./editor-components"
import { EditorService } from "./editor-service"
import { ElementFactoryRegistry } from "./shapes/shape-factory"
import { TextBoxFactory, TextBoxNode } from "./shapes/text-box-factory"
import { Document } from "./vieditor-element"
import { LineNode, LineNodeFactory } from "./shapes/line-factory"

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
}

export type Cursor = {
  col: number
  row: number
}

export class UI {
  cursor: Cursor = { col: 0, row: 0 }

  setCursorPosition(col: number, row: number) {
    this.cursor.col = col
    this.cursor.row = row
  }
}

export class Canvas {
  constructor(public document: Document) {}
}

export class EditorLayer implements Layer {
  static GRID_GAP = 40
  static CURSOR_SIZE = 6
  static RECT_SIZE = 30
  static GRID_DOT_SIZE = 2
  private contextNavigator: ContextNavigator
  private document: Document = new Document()
  private ui: UI = new UI()
  private canvas: Canvas = new Canvas(this.document)
  private entityManager: EntityManager
  private uiRendererSystem: UIRendererSystem
  private staticUIRendererSystem: StaticUIRendererSystem
  private canvasRendererSystem: CanvasRendererSystem
  private editorService: EditorService
  private factoryRegistry: ElementFactoryRegistry

  constructor(
    private readonly uiRenderer: UIRenderer,
    private readonly canvasRenderer: CanvasRenderer
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

    const cursorEntity = this.entityManager.createEntity()

    this.editorService = new EditorService(
      this.document,
      this.entityManager,
      cursorEntity,
      this.ui,
      this.canvas
    )

    this.factoryRegistry = new ElementFactoryRegistry(
      this.editorService,
      this.contextNavigator
    )

    this.factoryRegistry.registerFactory(TextBoxNode, TextBoxFactory)
    this.factoryRegistry.registerFactory(LineNode, LineNodeFactory)

    this.addUIGrid()
    this.staticUIRendererSystem.update()

    this.addCursor(cursorEntity)
    this.render()

    const rootContext = new RootContext(
      this.editorService,
      this.contextNavigator,
      this.factoryRegistry
    )
    this.contextNavigator.registerContext("root", rootContext)
    this.contextNavigator.navigateTo("root")
  }

  onEvent(event: Event): void {
    this.contextNavigator.getCurrentContext().onEvent(event)
    this.render()
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

  private addUIGrid() {
    const { width, height } = this.uiRenderer.getSize()
    const maxColumns = Math.floor(width / EditorLayer.GRID_GAP)
    const maxRows = Math.floor(height / EditorLayer.GRID_GAP)
    for (let i = 1; i <= maxColumns; i++) {
      for (let j = 1; j <= maxRows; j++) {
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
}
