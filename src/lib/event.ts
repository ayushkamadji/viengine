export interface Event {
  readonly type: EventType
  handled: boolean
  toString(): string
}

export type EventType =
  | "KeyDownEvent"
  | "KeyUpEvent"
  | "WindowResizeEvent"
  | "NoOp"
