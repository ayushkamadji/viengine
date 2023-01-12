import { Event } from "../../lib/event"
import { CommandResolver } from "./command-decorator"

export interface Context {
  name: string
  onEvent(event: Event): void
  onEntry(params?: any): void
  onExit(params?: any): void
  onRemove(params?: any): void
}

export abstract class AbstractContext implements Context {
  name = ""

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
