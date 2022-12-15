import "./normalize.css"
import "./style.css"
import "./lib/ui.css"
import "./lib/canvas.css"
import { Application } from "./lib/application"
import { Debugger } from "./lib/debug/debugger"
import { BrowserWindow } from "./lib/window"
import { EditorLayer } from "./editor/editor"
import { UIRenderer } from "./lib/ui-renderer"
import { CanvasRenderer } from "./lib/canvas-renderer"

document.addEventListener("DOMContentLoaded", () => {
  const _debugger = new Debugger(document, 5)
  window["ViEngine"] = {
    _debugger,
  }
  const logger = _debugger.getLogger()
  const applicationWindow = new BrowserWindow(window)
  const app = new Application(logger, applicationWindow)

  const uiRoot = document.createElement("div")
  uiRoot.classList.add("ui")
  document.body.appendChild(uiRoot)
  const uiRenderer = new UIRenderer(uiRoot, document)
  window["ViEngine"]["uiRenderer"] = uiRenderer

  const canvasRootContainer = document.createElement("div")
  canvasRootContainer.classList.add("canvas")
  document.body.appendChild(canvasRootContainer)
  const canvasRenderer = new CanvasRenderer(canvasRootContainer, document)

  const editorLayer = new EditorLayer(uiRenderer, canvasRenderer)

  app.pushLayer(editorLayer)

  app.start()
})
