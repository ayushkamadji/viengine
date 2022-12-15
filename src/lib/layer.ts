import { Event } from "./event"

export interface Layer {
  onEvent(event: Event): void
}
export class LayerStack {
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
