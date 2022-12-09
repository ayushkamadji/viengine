import "./normalize.css"
import "./style.css"
import { Application, ContextLayer } from "./lib/application"
import { Debugger } from "./lib/debug/debugger"
import { BrowserWindow } from "./lib/window"

document.addEventListener("DOMContentLoaded", () => {
  const _debugger = new Debugger(document, 5)
  window["ViEngine"] = {
    _debugger,
  }
  const logger = _debugger.getLogger()
  const applicationWindow = new BrowserWindow(window)
  const app = new Application(logger, applicationWindow)

  const contextLayer = new ContextLayer(logger)
  app.pushLayer(contextLayer)
  app.start()
})
