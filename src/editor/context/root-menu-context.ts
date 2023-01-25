import { Entity } from "../ecs/entity-component-system"
import { EditorService } from "../editor-service"
import { CommandContext, Command } from "./command-decorator"
import {
  AbstractCommandContext,
  Context,
  emptyContext,
} from "./context.interface"
import { RootMenu } from "./root-components"

//TODO: move to json
const keybindsJson = {
  Escape: "exit",
  j: "menuDown",
  k: "menuUp",
  Enter: "executeCommand",
}

const keybinds = Object.entries(keybindsJson)

@CommandContext({ keybinds })
export class RootMenuContext extends AbstractCommandContext {
  name: string
  private exitContext: Context = emptyContext
  private menuEntity: Entity | undefined
  private selectedMenuItem = 0
  //TODO: move filtering to command decorator config and resolver
  private menuItemHideFilter = ["menuUp", "menuDown", "executeCommand"]

  constructor(private readonly editorService: EditorService, name: string) {
    super()
    this.name = name
  }

  onEntry(): void {
    if (!this.menuEntity) {
      this.menuEntity = this.editorService.generateEntity()
    }
    this.selectedMenuItem = 0
    this.createMenuUI(this.menuEntity)
  }

  setExitContext(context: Context): void {
    this.exitContext = context
  }

  @Command("exportSVG")
  private async exportSVG(): Promise<void> {
    await this.editorService.exportSVG()
    this.exit()
  }

  @Command("exit")
  private exit(): void {
    this.destroyMenu()
    this.editorService.navigateTo(this.exitContext)
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
  private async executeCommand(): Promise<void> {
    const commandName = this.getMenuItems()[this.selectedMenuItem]
    const command = this.commandResolver.resolveCommand(commandName)
    if (command) {
      await command()
    }
  }

  private getMenuItems(): string[] {
    const allCommands = this.commandResolver.getCommandNames()
    return allCommands.filter((command) => {
      return !this.menuItemHideFilter.includes(command)
    })
  }

  private createMenuUI(entity: Entity): void {
    this.editorService.addUIAtCursor(entity, RootMenu, {
      items: this.getMenuItems(),
      selectedIndex: this.selectedMenuItem,
    })
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
