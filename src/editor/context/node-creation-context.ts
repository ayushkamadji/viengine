import { Event } from "../../lib/event"
import { AbstractContext, Context } from "./context.interface"
import { ContextNavigator } from "./context-navigator"
import { ViEditor, EditorService, Util } from "../editor"
import { Command, CommandContext } from "./command-decorator"

//TODO: move to json
const keybindsJson = {
  Escape: "exit",
  Enter: "createNode",
}

const keybinds = Object.entries(keybindsJson)

@CommandContext({ keybinds })
export class NodeCreationContext extends AbstractContext {
  name: string
  private exitContext: Context = { name: "nullContext", onEvent: () => {} }

  constructor(
    private readonly editorService: EditorService,
    contextNavigator: ContextNavigator,
    name: string
  ) {
    super(contextNavigator)
    this.name = name
  }

  onEvent(_event: Event): void {}

  setExitContext(context: Context): void {
    this.exitContext = context
  }

  @Command("exit")
  private exit(): void {
    this.getNavigator().navigateTo("root")
  }

  @Command("createNode")
  private createNode(): void {
    const { col, row } = this.editorService.getCursorPosition()
    const [x, y] = Util.cursorColRowToCanvasXY(col, row)
    this.editorService.document.addElement(
      new ViEditor.Node(this.editorService.generateEntity(), x, y)
    )
    this.exit()
  }
}
