import { Context, emptyContext } from "./context.interface"

export class ContextNavigator {
  private contextRegistry: Map<string, Context> = new Map()
  private currentContext: Context

  constructor() {
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
      this.currentContext.onExit()
      this.currentContext = context
      this.currentContext.onEntry()
    }
  }

  getCurrentContext(): Context {
    return this.currentContext
  }
}
