import "reflect-metadata"
import { Logger } from "./logger"
import { ApplicationWindow } from "./window"
import { Event } from "./event"
import { LayerStack, Layer } from "./layer"

export class Application {
  private readonly layerStack = new LayerStack()
  constructor(private readonly logger: Logger, window: ApplicationWindow) {
    window.setEventCallback(this.onEvent)
  }

  start() {
    this.logger.info("Starting application...")
  }

  private onEvent = async (event: Event) => {
    this.logger.info(`Event: ${event.type}`)
    await this.layerStack.onEvent(event)
  }

  pushLayer(layer: Layer) {
    this.layerStack.pushLayer(layer)
  }
}
