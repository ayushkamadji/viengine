export interface Logger {
  log(message: string): void
  error(message: string): void
  warn(message: string): void
  info(message: string): void
  debug(message: string): void
}

export class ConsoleLogger implements Logger {
  constructor(private readonly name: string) {}
  error(message: string): void {
    console.error(this.formatMessage(message))
  }
  warn(message: string): void {
    console.warn(this.formatMessage(message))
  }
  info(message: string): void {
    console.info(this.formatMessage(message))
  }
  debug(message: string): void {
    console.debug(this.formatMessage(message))
  }
  log(message: string): void {
    console.log(this.formatMessage(message))
  }
  private formatMessage(message: string): string {
    return `[${this.name}]: ${message}`
  }
}
