import {
  AbstractCommandContext,
  Context,
  emptyContext,
} from "./context.interface"
import { ContextNavigator } from "./context-navigator"
import { EditorService } from "../editor-service"
import { Command, CommandContext } from "./command-decorator"
import { Entity } from "../ecs/entity-component-system"
import { Menu } from "./root-components"
import { ElementFactoryRegistry } from "../shapes/shape-factory"
import { TextBoxNode } from "../shapes/text-box-factory"
import type { ElementClass } from "../shapes/shape-factory"
import { LineNode } from "../shapes/line-factory"

//TODO: move to json
const keybindsJson = {
  Escape: "exit",
  j: "menuDown",
  k: "menuUp",
  Enter: "executeCommand",
}

const keybinds = Object.entries(keybindsJson)

@CommandContext({ keybinds })
export class NodeCreationContext extends AbstractCommandContext {
  name: string
  private exitContext: Context = emptyContext
  private menuEntity: Entity | undefined
  private selectedMenuItem = 0
  //TODO: move filtering to command decorator config and resolver
  private menuItemHideFilter = ["menuUp", "menuDown", "executeCommand"]

  constructor(
    private readonly editorService: EditorService,
    contextNavigator: ContextNavigator,
    private readonly factoryRegistry: ElementFactoryRegistry,
    name: string
  ) {
    super(contextNavigator)
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

  @Command("textBox")
  private createTextBox(text = "hello world"): void {
    this.destroyMenu()
    this.createElementNode(TextBoxNode, text)
  }

  @Command("arrow")
  private createLine(): void {
    this.destroyMenu()
    this.createElementNode(LineNode)
  }

  @Command("exit")
  private exit(): void {
    this.destroyMenu()
    this.getNavigator().navigateTo(this.exitContext)
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

  private getMenuItems(): string[] {
    const allCommands = this.commandResolver.getCommandNames()
    return allCommands.filter((command) => {
      return !this.menuItemHideFilter.includes(command)
    })
  }

  private createElementNode(element: ElementClass, ...args: any[]) {
    const factory = this.factoryRegistry.getFactory(element)
    if (factory) {
      factory.create(...args)
    }
  }

  private createMenuUI(entity: Entity): void {
    this.editorService.addUIAtCursor(entity, Menu, {
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
