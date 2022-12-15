import { CanvasRenderer } from "../lib/canvas-renderer"
import { Event, KeyDownEvent } from "../lib/event"
import { Layer } from "../lib/layer"
import { UIRenderer } from "../lib/ui-renderer"
import "./editor.css"

class EditorService {
  constructor(
    readonly document: ViEditor.Document,
    private readonly entityIDManager: EntityIDManager
  ) {}

  generateEntityID(): number {
    return this.entityIDManager.getNewEntityID()
  }
}

export class EditorLayer implements Layer {
  private static GRID_GAP = 40
  private contextNavigator: ContextNavigator
  private document: ViEditor.Document = new ViEditor.Document()
  private entityIDManager: EntityIDManager = new EntityIDManager()
  private editorService: EditorService = new EditorService(
    this.document,
    this.entityIDManager
  )

  constructor(
    private readonly uiRenderer: UIRenderer,
    private readonly canvasRenderer: CanvasRenderer
  ) {
    this.contextNavigator = new ContextNavigator()
    const rootContext = new RootContext(
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
      if (element.name === "node") {
        const canvasElement = this.canvasRenderer
          .getElementBuilder()
          .withElementName("rect")
          .withID(element.entityID.toString())
          .withAttributes(
            new Map([
              ["x", 40 + element.entityID * 10],
              ["y", 40 + element.entityID * 10],
              ["width", 30],
              ["height", 30],
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
    this.uiRenderer.render()
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

interface Context {
  name: string
  onEvent(event: Event): void
}

abstract class AbstractContext implements Context {
  protected getNavigator: () => ContextNavigator
  abstract name: string

  constructor(contextNavigator: ContextNavigator) {
    this.getNavigator = () => contextNavigator
  }

  abstract onEvent(event: Event): void
}

class RootContext extends AbstractContext {
  name: string
  private readonly nodeCreationContext: NodeCreationContext

  constructor(
    private readonly editorService,
    contextNavigator: ContextNavigator,
    name = "root"
  ) {
    super(contextNavigator)
    this.name = name
    this.nodeCreationContext = new NodeCreationContext(
      editorService,
      contextNavigator,
      "nodeCreation"
    )
    this.nodeCreationContext.setExitContext(this)
    contextNavigator.registerContext(
      `${name}.nodeCreation`,
      this.nodeCreationContext
    )
  }

  onEvent(event: Event): void {
    if (event instanceof KeyDownEvent) {
      switch (event.key) {
        case "Enter":
          console.log("Root enter")
          this.navigateToNodeCreationContext()
          break
        default:
          break
      }
    }
  }

  private navigateToNodeCreationContext(): void {
    this.getNavigator().navigateTo(`${"root"}.nodeCreation`)
  }
}

class NodeCreationContext extends AbstractContext {
  name: string
  private exitContext: Context = { name: "nullContext", onEvent: () => {} }

  constructor(
    private readonly editorService,
    contextNavigator: ContextNavigator,
    name: string
  ) {
    super(contextNavigator)
    this.name = name
  }

  onEvent(event: Event): void {
    if (event instanceof KeyDownEvent && !event.isRepeat) {
      switch (event.key) {
        case "Escape":
          this.exit()
          break
        case "Enter":
          this.createNode()
          break
        default:
          break
      }
    }
  }

  setExitContext(context: Context): void {
    this.exitContext = context
  }

  private exit(): void {
    this.getNavigator().navigateTo("root")
  }

  private createNode(): void {
    this.editorService.document.addElement(
      new ViEditor.Node(this.editorService.generateEntityID())
    )
    console.log({ document: this.editorService.document })
    console.log("Node created")
    this.exit()
  }
}

class ContextNavigator {
  private contextRegistry: Map<string, Context> = new Map()
  private currentContext: Context

  constructor() {
    const emptyContext: Context = {
      name: "nullContext",
      onEvent: () => {},
    }

    this.currentContext = emptyContext
  }

  registerContext(path: string, context: Context): void {
    this.contextRegistry.set(path, context)
  }

  navigateTo(path: Context | string): void {
    let resolvedPath: string

    if (typeof path === "string") {
      resolvedPath = path
    } else {
      resolvedPath = path.name
    }

    const context = this.contextRegistry.get(resolvedPath)

    if (context) {
      console.log(`Navigating to ${resolvedPath}`)
      this.currentContext = context
    }
  }

  getCurrentContext(): Context {
    return this.currentContext
  }
}

namespace ViEditor {
  export interface Element {
    entityID: number
    name: string
    children?: Element[]
  }

  export class Node implements Element {
    name = "node"
    text = ""
    constructor(public entityID: number) {
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
