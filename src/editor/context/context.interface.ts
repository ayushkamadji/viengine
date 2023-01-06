import { Event } from "../../lib/event"
import { ContextNavigator } from "./context-navigator"

export interface Context {
  name: string
  onEvent(event: Event): void
  onEntry(): void
  onExit(): void
}

export abstract class AbstractContext implements Context {
  protected getNavigator: () => ContextNavigator
  abstract name: string

  constructor(contextNavigator: ContextNavigator) {
    this.getNavigator = () => contextNavigator
  }

  abstract onEvent(event: Event): void

  onEntry(): void {}
  onExit(): void {}
}

export const emptyContext = {
  name: "emptyContext",
  onEvent: () => {},
  onEntry: () => {},
  onExit: () => {},
}
