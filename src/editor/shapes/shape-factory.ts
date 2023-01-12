import { Element } from "../vieditor-element"
import { EditorService } from "../editor-service"

export interface ShapeFactory {
  editorElement: ElementClass
  name: string
  create(...args: any[]): void
}

export type ElementClass = { new (...args: any[]): Element }
export type FactoryClass = {
  new (editorService: EditorService, ...args: any[]): ShapeFactory
}

export class ElementFactoryRegistry {
  private factoryMap: Map<ElementClass, ShapeFactory> = new Map()

  constructor(private readonly editorService: EditorService) {}

  registerFactory(
    elementClass: ElementClass,
    factoryClass: FactoryClass,
    ...args: any[]
  ): void {
    this.factoryMap.set(
      elementClass,
      new factoryClass(this.editorService, ...args)
    )
  }

  getFactory(elementClass: ElementClass): ShapeFactory | undefined {
    return this.factoryMap.get(elementClass)
  }
}
