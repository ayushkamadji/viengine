import { Event } from "./event"
export class WindowResizeEvent implements Event {
  readonly type = "WindowResizeEvent"
  handled = false

  constructor(public readonly width: number, public readonly height: number) {}

  toString(): string {
    return `WindowResizeEvent: ${this.width}x${this.height}`
  }
}
