import { Event } from "./event"

export interface Layer {
  onEvent(event: Event): void | Promise<void>
}
export class LayerStack {
  private layers: Layer[] = []

  async onEvent(event: Event) {
    for (const layer of this.layers) {
      await layer.onEvent(event)
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
