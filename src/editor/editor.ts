import { CanvasRenderer } from "../lib/canvas-renderer"
import { Event } from "../lib/event"
import { Layer } from "../lib/layer"
import { UIRenderer } from "../lib/ui-renderer"
import { ContextNavigator } from "./context/context-navigator"
import "./editor.css"
import { RootContext } from "./context/root-context"
import {
  Entity,
  EntityManager,
  UIRendererComponent,
  UIRendererSystem,
} from "./ecs/entity-component-system"

export class EditorService {
  constructor(
    readonly document: ViEditor.Document,
    private readonly entityIDManager: EntityIDManager,
    private readonly entityManager: EntityManager,
    private readonly cursorEntity: Entity,
    private readonly ui: UI
  ) {}

  generateEntity(): number {
    return this.entityManager.createEntity()
  }

  getCursorEntity(): Entity {
    return this.cursorEntity
  }

  setCursorPosition(col: number, row: number) {
    this.ui.setCursorPosition(col, row)
    const rendererComponent: UIRendererComponent = this.entityManager
      .getEntityComponentContainer(this.cursorEntity)
      .get(UIRendererComponent)
    const [x, y] = Util.cursorColRowToCanvasXY(col, row)
    rendererComponent.x = x
    rendererComponent.y = y
  }

  getCursorPosition(): { col: number; row: number } {
    return this.ui.cursor
  }
}

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
  document: ViEditor.Document = new ViEditor.Document()
}

export class EditorLayer implements Layer {
  static GRID_GAP = 40
  static CURSOR_SIZE = 6
  static RECT_SIZE = 30
  static GRID_DOT_SIZE = 2
  private contextNavigator: ContextNavigator
  private document: ViEditor.Document = new ViEditor.Document()
  private entityIDManager: EntityIDManager = new EntityIDManager()
  private ui: UI
  private entityManager: EntityManager
  private uiRendererSystem: UIRendererSystem
  private editorService: EditorService

  constructor(
    private readonly uiRenderer: UIRenderer,
    private readonly canvasRenderer: CanvasRenderer
  ) {
    this.ui = new UI()
    this.contextNavigator = new ContextNavigator()
    this.entityManager = new EntityManager()

    this.uiRendererSystem = new UIRendererSystem(
      this.entityManager,
      this.uiRenderer
    )

    const cursorEntity = this.entityManager.createEntity()

    this.editorService = new EditorService(
      this.document,
      this.entityIDManager,
      this.entityManager,
      cursorEntity,
      this.ui
    )

    const rootContext = new RootContext(
      this.editorService,
      this.contextNavigator
    )
    this.contextNavigator.registerContext("root", rootContext)
    this.contextNavigator.navigateTo("root")

    this.addUIGrid()
    this.addCursor(cursorEntity)
    this.render()
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
    this.canvasRenderer.clear()
    for (const element of this.document.children) {
      if (element instanceof ViEditor.Node) {
        const canvasElement = this.canvasRenderer
          .getElementBuilder()
          .withElementName("rect")
          .withID(element.entityID.toString())
          .withAttributes(
            new Map([
              ["x", element.x],
              ["y", element.y],
              ["width", EditorLayer.RECT_SIZE],
              ["height", EditorLayer.RECT_SIZE],
            ])
          )
          .withAttribute("stroke", "white")
          .build()
        this.canvasRenderer.addElement(canvasElement)
      }
    }
    this.canvasRenderer.render()
  }

  private renderUI() {
    this.uiRendererSystem.update()
  }

  private addCursor(entity: Entity) {
    const { col, row } = this.ui.cursor
    const [x, y] = Util.cursorColRowToCanvasXY(col, row)
    const uiRendererComponent = new UIRendererComponent(
      "div",
      "ui-cursor",
      ["ui-cursor"],
      x,
      y
    )

    this.entityManager.addComponent(entity, uiRendererComponent)
  }

  private addUIGrid() {
    const { width, height } = this.uiRenderer.getSize()
    const maxColumns = Math.floor(width / EditorLayer.GRID_GAP)
    const maxRows = Math.floor(height / EditorLayer.GRID_GAP)
    for (let i = 1; i <= maxColumns; i++) {
      for (let j = 1; j <= maxRows; j++) {
        const uiEntity = this.entityManager.createEntity()
        const uiRendererComponent = new UIRendererComponent(
          "div",
          `grid-point-${i}-${j}`,
          ["grid-point"],
          i * EditorLayer.GRID_GAP,
          j * EditorLayer.GRID_GAP
        )
        this.entityManager.addComponent(uiEntity, uiRendererComponent)
      }
    }
  }
}

export namespace ViEditor {
  export interface Element {
    entityID: number
    name: string
    children?: Element[]
  }

  export class Node implements Element {
    name = "node"
    text = ""
    constructor(public entityID: number, public x: number, public y: number) {
      this.text = entityID.toString()
    }
  }

  export class Document implements Element {
    entityID = 0
    name = "document"
    children: Element[] = []

    addElement(element: Element): void {
      this.children.push(element)
    }
  }
}

// TODO: Remove this
class EntityIDManager {
  private entityIDCounter = 1

  getNewEntityID(): number {
    return this.entityIDCounter++
  }
}
