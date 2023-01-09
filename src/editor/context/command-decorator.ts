import { Context } from "./context.interface"
import { Event, KeyDownEvent } from "../../lib/event"

export const COMMAND_NAME_METADATA = "commandName"

export interface CommandMetadata {
  commandName?: string
}

export const Command = (commandName: string) => {
  return (
    _target: object,
    _key: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    Reflect.defineMetadata(COMMAND_NAME_METADATA, commandName, descriptor.value)
    return descriptor
  }
}

type CommandContextConfig = {
  keybinds: [string, string][]
}

export function CommandContext(config: CommandContextConfig) {
  const result = function _CommandContext<
    T extends { new (...args: any[]): Context }
  >(ctor: T) {
    console.log("hello")
    return class extends ctor {
      private commandResolver: CommandResolver = new CommandResolver()
      constructor(...args: any[]) {
        super(...args)
        this.loadCommands()

        const { keybinds } = config
        this.loadKeybinds(keybinds)
      }

      onEvent(event: Event): void {
        super.onEvent(event)
        if (event instanceof KeyDownEvent) {
          const command = this.commandResolver.resolve(event.key)
          if (command) {
            command()
          }
        }
      }

      private loadCommands() {
        const thisProtoype = Object.getPrototypeOf(this)
        const mainPrototype = Object.getPrototypeOf(thisProtoype)
        const methods = Object.getOwnPropertyNames(mainPrototype)

        for (const method of methods) {
          if (method !== "constructor") {
            const commandNameMetadata = Reflect.getMetadata(
              COMMAND_NAME_METADATA,
              this[method] // FIXME
            )
            if (commandNameMetadata) {
              this.commandResolver.registerCommand(
                commandNameMetadata,
                this[method].bind(this)
              )
            }
          }
        }
      }

      private loadKeybinds(keybinds: [string, string][]): void {
        for (const [key, commandName] of keybinds) {
          this.commandResolver.registerKeybind(key, commandName)
        }
      }
    }
  }
  return result
}

class CommandResolver {
  private readonly keybinds: [string, string][] = []
  private readonly commands: Map<string, () => void> = new Map()

  registerCommand(key: string, command: () => void): void {
    this.commands.set(key, command)
  }

  registerKeybind(key: string, commandName: string): void {
    this.keybinds.push([key, commandName])
  }

  resolve(key: string): (() => void) | undefined {
    const commandName = this.keybinds.find(([keybind]) => keybind === key)?.[1]

    if (commandName) {
      return this.commands.get(commandName)
    }
  }
}
