import { Event as ViEvent } from "./event"
import { KeyDownEvent, KeyUpEvent } from "./keyboard-event"

export interface ApplicationWindow {
  setEventCallback(callback: (event: ViEvent) => void): void
}

export class BrowserWindow implements ApplicationWindow {
  private eventHandler?: (event: ViEvent) => void

  constructor(_window: Window) {
    _window.addEventListener("keydown", this.onWindowEvent<KeyboardEvent>())
    _window.addEventListener("keyup", this.onWindowEvent<KeyboardEvent>())
  }

  setEventCallback(callback: (event: ViEvent) => void): void {
    this.eventHandler = callback
  }

  private onWindowEvent<T extends Event>(): (event: T) => void {
    return (event: T) => {
      const e = EventFactory.createEvent<T>(event)

      if (e.type !== "NoOp" && this.eventHandler) {
        this.eventHandler(e)
      }
    }
  }
}

class EventFactory {
  static createEvent<T extends Event>(event: T): ViEvent {
    if (event instanceof KeyboardEvent) {
      switch (event.type) {
        case "keydown":
          return new KeyDownEvent(event.key, event.repeat)
        case "keyup":
          return new KeyUpEvent(event.key)
        default:
          break
      }
    }

    return {
      type: "NoOp",
      handled: true,
    }
  }
}
