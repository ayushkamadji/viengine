import { AbstractCommandContext } from "./context.interface"
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

export type CommandContextConfig = {
  keybinds: [string, string][]
}

export function CommandContext(config: CommandContextConfig) {
  const result = function _CommandContext<
    T extends { new (...args: any[]): AbstractCommandContext }
  >(ctor: T) {
    return class extends ctor {
      constructor(...args: any[]) {
        super(...args)
        this.loadCommands()

        const { keybinds } = config
        this.loadKeybinds(keybinds)
      }

      async onEvent(event: Event): Promise<void> {
        await super.onEvent(event)
        if (event instanceof KeyDownEvent) {
          const command = this.commandResolver.resolve(event.key)
          if (command) {
            await command()
          }
        }
        return
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

type CommandFunction = () => void | Promise<void>

export class CommandResolver {
  private readonly keybinds: [string, string][] = []
  private readonly commands: Map<string, CommandFunction> = new Map()

  registerCommand(key: string, command: CommandFunction): void {
    this.commands.set(key, command)
  }

  registerKeybind(key: string, commandName: string): void {
    this.keybinds.push([key, commandName])
  }

  resolve(key: string): CommandFunction | undefined {
    const commandName = this.keybinds.find(([keybind]) => keybind === key)?.[1]

    if (commandName) {
      return this.commands.get(commandName)
    }
  }

  resolveCommand(commandName: string): CommandFunction | undefined {
    return this.commands.get(commandName)
  }

  getCommandNames(): string[] {
    // Maps remember insertion order so index will always be consistent
    return [...this.commands.keys()]
  }

  getKeybinds(): [string, string][] {
    return this.keybinds
  }
}
