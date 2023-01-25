import "./normalize.css"
import "./style.css"
import "./lib/ui.css"
import "./lib/canvas.css"
import { Application } from "./lib/application"
//TODO: Redo internal debugger import { Debugger } from "./lib/debug/debugger"
import { BrowserWindow } from "./lib/window"
import { EditorLayer } from "./editor/editor"
import { UIRenderer } from "./lib/ui-renderer"
import { CanvasRenderer } from "./lib/canvas-renderer"
import { TauriSystemUtil } from "./lib/system-util"
import { ConsoleLogger } from "./lib/logger"
import { BrowserDocumentUtil } from "./lib/document-util"

document.addEventListener("DOMContentLoaded", () => {
  window["ViEngine"] = {}
  // App setup
  const logger = new ConsoleLogger("CORE")
  const applicationWindow = new BrowserWindow(window)
  const app = new Application(logger, applicationWindow)

  // Layer setup
  const uiRoot = document.createElement("div")
  uiRoot.classList.add("ui")
  document.body.appendChild(uiRoot)
  const uiRenderer = new UIRenderer(uiRoot, document)
  window["ViEngine"]["uiRenderer"] = uiRenderer

  const canvasRootContainer = document.createElement("div")
  canvasRootContainer.classList.add("canvas")
  document.body.appendChild(canvasRootContainer)
  const canvasRenderer = new CanvasRenderer(canvasRootContainer, document)

  const system = new TauriSystemUtil()
  const documentUtil = new BrowserDocumentUtil(document)
  const editorLayer = new EditorLayer(
    uiRenderer,
    canvasRenderer,
    system,
    documentUtil
  )

  // Inject and start
  app.pushLayer(editorLayer)

  app.start()
})
