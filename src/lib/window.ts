import { Event as ViEvent } from "./event"

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

  private onWindowEvent(type: string): (event: Event) => void {
    //TODO: map type strings to ViewEvent types

    const handleFn = (event: Event) => {
      const e: ViEvent = {
        type: type,
        handled: false,
      }

      this.eventHandler(e)

      if (e.handled) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    return handleFn
  }
}
