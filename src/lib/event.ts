export interface Event {
  type: string
  handled: boolean
  toString(): string
}

interface KeyEvent extends Event {
  readonly key: string
}

export class KeyDownEvent implements KeyEvent {
  key: string
  type: string
  handled: boolean
  isRepeat: boolean

  constructor(...args) {
    this.key = args[0]
    this.type = "KeyDownEvent"
    this.handled = false
    this.isRepeat = false
  }

  toString(): string {
    return `KeyDownEvent: ${this.key}`
  }
}

export class KeyUpEvent implements KeyEvent {
  key: string
  type: string
  handled: boolean

  constructor(...args) {
    this.key = args[0]
    this.type = "KeyUpEvent"
    this.handled = false
  }

  toString(): string {
    return `KeyUpEvent: ${this.key}`
  }
}
