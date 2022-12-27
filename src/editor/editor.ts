import { CanvasRenderer } from "../lib/canvas-renderer"
import { Event } from "../lib/event"
import { Layer } from "../lib/layer"
import { UIRenderer } from "../lib/ui-renderer"
import { ContextNavigator } from "./context/context-navigator"
import "./editor.css"
import { RootContext } from "./context/root-context"

class EditorService {
  constructor(
    readonly document: ViEditor.Document,
    private readonly entityIDManager: EntityIDManager
  ) {}

  generateEntityID(): number {
    return this.entityIDManager.getNewEntityID()
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

export class EditorLayer implements Layer {
  static GRID_GAP = 40
  static CURSOR_SIZE = 6
  static RECT_SIZE = 30
  private contextNavigator: ContextNavigator
  private document: ViEditor.Document = new ViEditor.Document()
  private entityIDManager: EntityIDManager = new EntityIDManager()
  private editorService: EditorService = new EditorService(
    this.document,
    this.entityIDManager
  )
  private ui: UI

  constructor(
    private readonly uiRenderer: UIRenderer,
    private readonly canvasRenderer: CanvasRenderer
  ) {
    this.ui = new UI()
    this.contextNavigator = new ContextNavigator()
    const rootContext = new RootContext(
      this.ui,
      this.editorService,
      this.contextNavigator
    )
    this.contextNavigator.registerContext("root", rootContext)
    this.contextNavigator.navigateTo("root")
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
    this.uiRenderer.clear()
    this.addUIGrid()
    this.addCursor()
    this.uiRenderer.render()
  }

  private addCursor() {
    const cursorElement = this.uiRenderer
      .getElementBuilder()
      .withClass("ui-cursor")
      .withID("ui-cursor")
      .withX(
        (this.ui.cursor.col + 1) * EditorLayer.GRID_GAP -
          EditorLayer.CURSOR_SIZE / 2
      )
      .withY(
        (this.ui.cursor.row + 1) * EditorLayer.GRID_GAP -
          EditorLayer.CURSOR_SIZE / 2
      )
      .build()

    this.uiRenderer.addElement(cursorElement)
  }

  private addUIGrid() {
    const { width, height } = this.uiRenderer.getSize()
    const maxColumns = Math.floor(width / EditorLayer.GRID_GAP)
    const maxRows = Math.floor(height / EditorLayer.GRID_GAP)
    for (let i = 1; i <= maxColumns; i++) {
      for (let j = 1; j <= maxRows; j++) {
        const uiElement = this.uiRenderer
          .getElementBuilder()
          .withClass("grid-point")
          .withX(i * EditorLayer.GRID_GAP)
          .withY(j * EditorLayer.GRID_GAP)
          .build()
        this.uiRenderer.addElement(uiElement)
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

class EntityIDManager {
  private entityIDCounter = 1

  getNewEntityID(): number {
    return this.entityIDCounter++
  }
}
