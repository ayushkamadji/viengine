import { debounce } from "lodash"
import { Event as ViEvent } from "./event"
import { KeyDownEvent, KeyUpEvent } from "./keyboard-event"
import { WindowResizeEvent } from "./window-event"

export interface ApplicationWindow {
  setEventCallback(callback: (event: ViEvent) => void): void
}

export class BrowserWindow implements ApplicationWindow {
  private eventHandler?: (event: ViEvent) => void

  constructor(_window: Window) {
    _window.addEventListener("keydown", this.onWindowEvent<KeyboardEvent>())
    _window.addEventListener("keyup", this.onWindowEvent<KeyboardEvent>())
    _window.addEventListener("resize", debounce(this.onWindowEvent<Event>()))

    // TODO: have this conditional by environment
    if (process.env.NODE_ENV === "production") {
      _window.addEventListener("contextmenu", (e) => e.preventDefault())
    }
  }

  setEventCallback(callback: (event: ViEvent) => void): void {
    this.eventHandler = callback
  }

  private onWindowEvent<T extends Event>(): (event: T) => void {
    return (event: T) => {
      event.preventDefault()
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
      const {
        ctrlKey: ctrl,
        altKey: alt,
        shiftKey: shift,
        metaKey: meta,
        key,
        code,
        repeat,
      } = event
      switch (event.type) {
        case "keydown":
          return new KeyDownEvent(key, code, { ctrl, alt, shift, meta }, repeat)
        case "keyup":
          return new KeyUpEvent(key, code, { ctrl, alt, shift, meta })
        default:
          break
      }
    }

    if (event instanceof Event) {
      switch (event.type) {
        case "resize":
          return new WindowResizeEvent(
            (event.target as Window).innerWidth,
            (event.target as Window).innerHeight
          )
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
