import { Event, EventType } from "./event"

interface KeyEvent extends Event {
  readonly key: string
}

export class KeyDownEvent implements KeyEvent {
  readonly type: EventType = "KeyDownEvent"

  constructor(
    public readonly key: string,
    public readonly isRepeat: boolean = false,
    public handled: boolean = false
  ) {}

  toString(): string {
    return `KeyDownEvent: ${this.key}`
  }
}

export class KeyUpEvent implements KeyEvent {
  type: EventType = "KeyUpEvent"

  constructor(public readonly key: string, public handled: boolean = false) {}

  toString(): string {
    return `KeyUpEvent: ${this.key}`
  }
}
