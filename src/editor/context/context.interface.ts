import { Event } from "../../lib/event"
import { CommandResolver } from "./command-decorator"
import { ContextNavigator } from "./context-navigator"

export interface Context {
  name: string
  onEvent(event: Event): void
  onEntry(params?: any): void
  onExit(params?: any): void
  onRemove(params?: any): void
}

export abstract class AbstractContext implements Context {
  protected getNavigator: () => ContextNavigator
  name = ""

  constructor(contextNavigator: ContextNavigator) {
    this.getNavigator = () => contextNavigator
  }

  onEvent(_event: Event): void {}
  onEntry(): void {}
  onExit(): void {}
  onRemove(): void {}
}

export abstract class AbstractCommandContext extends AbstractContext {
  protected readonly commandResolver = new CommandResolver()

  getHints(): [string, string][] {
    return this.commandResolver.getKeybinds()
  }
}
export interface ContextFactory {
  create(...args: any[]): Context
}

export const emptyContext = {
  name: "emptyContext",
  onEvent: () => {},
  onEntry: () => {},
  onExit: () => {},
  onRemove: () => {},
}
