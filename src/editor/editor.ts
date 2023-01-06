import { CanvasRenderer } from "../lib/canvas-renderer"
import { Event } from "../lib/event"
import { Layer } from "../lib/layer"
import { UIRenderer } from "../lib/ui-renderer"
import { ContextNavigator } from "./context/context-navigator"
import "./editor.css"
import { RootContext } from "./context/root-context"
import { Entity, EntityManager } from "./ecs/entity-component-system"
import {
  CanvasRendererComponent,
  CanvasRendererSystem,
  StaticUIRendererComponent,
  StaticUIRendererSystem,
  UIRendererComponent,
  UIRendererSystem,
} from "./ecs-systems/render-system"
import { Cursor, GridPoint } from "./editor-components"
import { ElementFunction } from "./ecs-systems/renderer-element"

export class EditorService {
  constructor(
    readonly document: ViEditor.Document,
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

  addElementAtCursor(element: ViEditor.Element) {
    this.canvas.document.addElement(element)

    if (element instanceof ViEditor.Node) {
      const entity: Entity = element.entityID

      const [x, y] = this.getCursorXY()
      element.x = x
      element.y = y

      const attributes: Map<string, string | number> = new Map<
        string,
        string | number
      >([
        ["x", element.x],
        ["y", element.y],
        ["width", EditorLayer.RECT_SIZE],
        ["height", EditorLayer.RECT_SIZE],
        ["stroke", "white"],
      ])

      const canvasRendererComponent: CanvasRendererComponent =
        new CanvasRendererComponent(
          "rect",
          element.entityID.toString(),
          [],
          attributes
        )

      this.entityManager.addComponent(entity, canvasRendererComponent)
    }
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

  private getCursorEntityComponentContainer(): UIRendererComponent {
    return this.entityManager
      .getEntityComponentContainer(this.cursorEntity)
      .get(UIRendererComponent)
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
  private ui: UI = new UI()
  private canvas: Canvas = new Canvas()
  private entityManager: EntityManager
  private uiRendererSystem: UIRendererSystem
  private staticUIRendererSystem: StaticUIRendererSystem
  private canvasRendererSystem: CanvasRendererSystem
  private editorService: EditorService

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

    this.addUIGrid()
    this.staticUIRendererSystem.update()

    this.addCursor(cursorEntity)
    this.render()

    const rootContext = new RootContext(
      this.editorService,
      this.contextNavigator
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

export namespace ViEditor {
  export interface Element {
    readonly entityID: number
    name: string
    children?: Element[]
  }

  export class Node implements Element {
    name = "node"
    text = ""

    constructor(
      public entityID: number,
      public x: number = 0,
      public y: number = 0
    ) {
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
