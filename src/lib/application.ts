import { Logger } from "./logger"
import { ApplicationWindow } from "./window"
import { Event } from "./event"

export class Application implements ContextualApplication {
  private readonly layerStack = new LayerStack()
  constructor(private readonly logger: Logger, window: ApplicationWindow) {
    window.setEventCallback(this.onEvent)
  }

  setCurrentContext(_context: Context): void {
    throw new Error("Method not implemented.")
  }

  start() {
    this.logger.info("Starting application...")
  }

  private onEvent = (event: Event) => {
    this.logger.info(`Event: ${event.type}`)
    this.layerStack.onEvent(event)
  }

  pushLayer(layer: Layer) {
    this.layerStack.pushLayer(layer)
  }
}

interface ContextualApplication extends Application {
  setCurrentContext(context: Context): void
}

interface Layer {
  onEvent(event: Event): void
}

class LayerStack {
  private layers: Layer[] = []

  onEvent(event: Event) {
    for (const layer of this.layers) {
      layer.onEvent(event)
      if (event.handled) {
        break
      }
    }
  }

  pushLayer(layer: Layer) {
    this.layers.push(layer)
  }

  popLayer() {
    this.layers.pop()
  }
}

export class ContextLayer implements Layer {
  constructor(private readonly logger: Logger) {}

  onEvent(event: Event): void {
    if (event.type === "keydown") {
      this.logMessage("ContextLayer: Key down")
      event.handled = true
    }
  }

  logMessage(message: string) {
    this.logger.info(message)
  }
}

export abstract class Context {
  abstract registerCommand(command: Command)
}

// class ContextGraph {
//   private contexts: Context[] = []

//   register(context: Context) {
//     this.contexts.push(context)
//   }
// }

interface Command {
  execute(...args: any[]): void
}

// class MoveCommand implements Command {
//   constructor(private handler: (context: Context) => void) {}
//   execute(context: Context) {
//     this.handler(context)
//   }
// }
