import { Event } from "../../lib/event"
import { ContextNavigator } from "./context-navigator"

export interface Context {
  name: string
  onEvent(event: Event): void
}

export abstract class AbstractContext implements Context {
  protected getNavigator: () => ContextNavigator
  abstract name: string

  constructor(contextNavigator: ContextNavigator) {
    this.getNavigator = () => contextNavigator
  }

  abstract onEvent(event: Event): void
}
