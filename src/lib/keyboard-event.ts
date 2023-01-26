import { Event, EventType } from "./event"
import { ComboCode, FunctionKeyPrintable, PrintableKeys } from "./keycode"

interface KeyEvent extends Event {
  readonly key: string | null
  readonly code: string
  readonly comboCode: string
}

export class KeyDownEvent implements KeyEvent {
  readonly type: EventType = "KeyDownEvent"
  readonly comboCode: string
  readonly key: string | null

  constructor(
    key: string,
    public readonly code: string,
    public readonly modifiers: ComboCodeOptions,
    public readonly isRepeat: boolean = false,
    public handled: boolean = false
  ) {
    const keyCandidate: string = FunctionKeyPrintable[key] || key
    const isPrintable = PrintableKeys[keyCandidate]
    this.key = isPrintable ? keyCandidate : null
    this.comboCode = codeToComboCode(code, modifiers)
  }

  toString(): string {
    return `KeyDownEvent: ${this.key}`
  }
}

export class KeyUpEvent implements KeyEvent {
  readonly type: EventType = "KeyUpEvent"
  readonly comboCode: string
  readonly key: string | null

  constructor(
    key: string,
    public readonly code: string,
    public readonly modifiers: ComboCodeOptions,
    public handled: boolean = false
  ) {
    const keyCandidate: string = FunctionKeyPrintable[key] || key
    this.key = PrintableKeys[keyCandidate] ? keyCandidate : null
    this.comboCode = codeToComboCode(code, modifiers)
  }

  toString(): string {
    return `KeyUpEvent: ${this.key}`
  }
}

type ComboCodeOptions = {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

function codeToComboCode(code: string, options: ComboCodeOptions) {
  const comboCode = ComboCode[code]

  if (comboCode === "unidentified") {
    return comboCode
  }

  const { ctrl, alt, shift, meta } = options
  const keys: string[] = []

  if (ctrl) {
    keys.push("ctrl")
  }

  if (alt) {
    keys.push("alt")
  }

  if (meta) {
    keys.push("meta")
  }

  if (shift) {
    keys.push("shift")
  }

  keys.push(comboCode)

  return keys.join("+")
}
