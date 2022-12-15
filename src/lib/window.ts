import { Event as ViEvent, KeyDownEvent, KeyUpEvent } from "./event"

export interface ApplicationWindow {
  setEventCallback(callback: (event: ViEvent) => void): void
}

export class BrowserWindow implements ApplicationWindow {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private eventHandler: (event: ViEvent) => void = () => {}

  constructor(_window: Window) {
    _window.addEventListener("keydown", this.onWindowEvent("keydown"))
    _window.addEventListener("keyup", this.onWindowEvent("keyup"))
  }

  setEventCallback(callback: (event: ViEvent) => void): void {
    this.eventHandler = callback
  }

  private onWindowEvent(type: "keydown" | "keyup"): (event: Event) => void {
    //TODO: map type strings to ViEvent types

    const handleFn = (event: Event) => {
      let e: ViEvent = {
        type: "unknown",
        handled: true,
      }
      if (type === "keydown") {
        e = new KeyDownEvent((event as KeyboardEvent).key)
        if ((event as KeyboardEvent).repeat) {
          ;(e as KeyDownEvent).isRepeat = true
        }
      } else if (type === "keyup") {
        e = new KeyUpEvent((event as KeyboardEvent).key)
      }

      console.log({ e })

      this.eventHandler(e)

      if (e.handled) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    return handleFn
  }
}
