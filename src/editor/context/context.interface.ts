import { Event } from "../../lib/event"
import { ElementFunction } from "../ecs-systems/renderer-element"
import { Entity } from "../ecs/entity-component-system"
import { EditorService } from "../editor-service"
import { Command, CommandResolver } from "./command-decorator"

export interface Context {
  name: string
  onEvent(event: Event): Promise<void>
  onEntry(params?: any): void
  onExit(params?: any): void
  onRemove(params?: any): void
}

export abstract class AbstractContext implements Context {
  name = ""

  async onEvent(_event: Event): Promise<void> {}
  onEntry(_params?: any): void {}
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

// TODO: This abstract class doesn't work
// Need to create abstract command context decorator to handle command registration
// from abstract classes
export abstract class AbstractCommandMenuContext extends AbstractCommandContext {
  // private exitContext: Context = this
  private menuEntity: Entity | undefined
  private selectedMenuItem = 0

  constructor(
    protected readonly editorService: EditorService,
    private readonly menuElement: ElementFunction
  ) {
    super()
  }

  onEntry(): void {
    if (!this.menuEntity) {
      this.menuEntity = this.editorService.generateEntity()
    }
    this.selectedMenuItem = 0
    this.createMenuUI(this.menuEntity)
  }

  onExit(): void {
    this.destroyMenu()
  }

  @Command("menuUp")
  private menuUp(): void {
    this.selectedMenuItem = Math.max(0, this.selectedMenuItem - 1)
    this.updateMenu()
  }

  @Command("menuDown")
  private menuDown(): void {
    const menuItems = this.getMenuItems()
    this.selectedMenuItem = Math.min(
      menuItems.length - 1,
      this.selectedMenuItem + 1
    )
    this.updateMenu()
  }

  @Command("executeCommand")
  private executeCommand(): void {
    const commandName = this.getMenuItems()[this.selectedMenuItem]
    const command = this.commandResolver.resolveCommand(commandName)
    if (command) {
      command()
    }
  }

  private createMenuUI(entity: Entity): void {
    this.editorService.addUIAtCursor(entity, this.menuElement, {
      items: this.getMenuItems(),
      selectedIndex: this.selectedMenuItem,
    })
  }

  private getMenuItems(): string[] {
    const allCommands = this.commandResolver.getCommandNames()
    return allCommands
    // return allCommands.filter((command) => {
    //   return !this.menuItemHideFilter.includes(command)
    // })
  }

  private updateMenu(): void {
    if (this.menuEntity) {
      this.editorService.updateUI(this.menuEntity, {
        selectedIndex: this.selectedMenuItem,
      })
    }
  }

  private destroyMenu(): void {
    if (this.menuEntity) {
      this.editorService.removeUI(this.menuEntity)
    }
  }
}

export const emptyContext = {
  name: "emptyContext",
  onEvent: async () => {},
  onEntry: () => {},
  onExit: () => {},
  onRemove: () => {},
}
