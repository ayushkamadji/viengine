import { Context, ContextFactory, emptyContext } from "./context.interface"

export class ContextNavigator {
  private contextRegistry: Map<string, Context | ContextFactory> = new Map()
  private currentContext: Context

  constructor() {
    this.currentContext = emptyContext
  }

  registerContext(path: string, context: Context | ContextFactory): void {
    this.contextRegistry.set(path, context)
  }

  navigateTo(path: Context | string, ...args: any[]): void {
    let resolvedPath: string

    if (typeof path === "string") {
      resolvedPath = path
    } else {
      resolvedPath = path.name
    }

    const context = this.contextRegistry.get(resolvedPath)

    if (context) {
      console.log(`Navigating to ${resolvedPath}`, ...args)

      this.currentContext.onExit()

      if ("create" in context) {
        this.currentContext = context.create(...args)
      } else {
        this.currentContext = context
      }

      this.currentContext.onEntry(...args)
    }
  }

  removeContext(path: string): void {
    this.currentContext.onRemove()
    this.contextRegistry.delete(path)
  }

  getCurrentContext(): Context {
    return this.currentContext
  }
}
