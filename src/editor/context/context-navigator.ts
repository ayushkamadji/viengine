import { Context } from "./context.interface"

export class ContextNavigator {
  private contextRegistry: Map<string, Context> = new Map()
  private currentContext: Context

  constructor() {
    const emptyContext: Context = {
      name: "nullContext",
      onEvent: () => {},
    }

    this.currentContext = emptyContext
  }

  registerContext(path: string, context: Context): void {
    this.contextRegistry.set(path, context)
  }

  navigateTo(path: Context | string): void {
    let resolvedPath: string

    if (typeof path === "string") {
      resolvedPath = path
    } else {
      resolvedPath = path.name
    }

    const context = this.contextRegistry.get(resolvedPath)

    if (context) {
      console.log(`Navigating to ${resolvedPath}`)
      this.currentContext = context
    }
  }

  getCurrentContext(): Context {
    return this.currentContext
  }
}
