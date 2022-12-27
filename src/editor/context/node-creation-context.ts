import { Event } from "../../lib/event"
import { AbstractContext, Context } from "./context.interface"
import { ContextNavigator } from "./context-navigator"
import { UI, ViEditor, EditorLayer } from "../editor"
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
    private readonly ui: UI,
    private readonly editorService,
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
    this.editorService.document.addElement(
      new ViEditor.Node(
        this.editorService.generateEntityID(),
        (this.ui.cursor.col + 1) * EditorLayer.GRID_GAP -
          EditorLayer.RECT_SIZE / 2,
        (this.ui.cursor.row + 1) * EditorLayer.GRID_GAP -
          EditorLayer.RECT_SIZE / 2
      )
    )
    console.log({ document: this.editorService.document })
    console.log("Node created")
    this.exit()
  }
}
