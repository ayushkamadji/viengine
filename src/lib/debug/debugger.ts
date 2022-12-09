import { Logger } from "../logger"
import "./debugger.css"

class DebugLogger implements Logger {
  private messages: string[] = []

  constructor(
    private readonly name: string,
    private readonly maxMessages: number
  ) {}

  log(message: string): void {
    this.add(`[LOG] ${this.formatMessage(message)}`)
  }

  error(message: string): void {
    this.add(`[ERROR] ${this.formatMessage(message)}`)
  }

  warn(message: string): void {
    this.add(`[WARN] ${this.formatMessage(message)}`)
  }

  info(message: string): void {
    this.add(`[INFO] ${this.formatMessage(message)}`)
  }

  debug(message: string): void {
    this.add(`[DEBUG] ${this.formatMessage(message)}`)
  }

  private formatMessage(message: string): string {
    return `[${this.name}]: ${message}`
  }

  private add(formatted: string): void {
    this.messages = [formatted, ...this.messages].slice(0, this.maxMessages)
  }

  getMessages(): string[] {
    return this.messages
  }
}

export class Debugger {
  private readonly logger: DebugLogger
  private readonly container: HTMLDivElement
  constructor(_document: Document, maxMessages = 10) {
    this.logger = new DebugLogger("DEBUGGER", maxMessages)
    this.container = _document.createElement("div")
    this.container.classList.add("debugger")
    _document.body.appendChild(this.container)
  }

  render(): void {
    this.container.innerHTML = this.logger
      .getMessages()
      .map((message) => `<div>${message}</div>`)
      .join("")
  }

  getLogger(): Logger {
    const keyToFn = (key) => (message: string) => {
      this.logger[key](message)
      this.render()
    }
    const logger = {
      log: keyToFn("log"),
      error: keyToFn("error"),
      warn: keyToFn("warn"),
      info: keyToFn("info"),
      debug: keyToFn("debug"),
    }

    return logger
  }
}
