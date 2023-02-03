import { EditorService } from "../editor-service"
import { StemElement } from "../vieditor-element"
import { ElementFunction } from "../ecs-systems/renderer-element"
import { Entity } from "../ecs/entity-component-system"
import { Geometry } from "../../lib/util/geometry"

export type GizmoProps = {
  points: Geometry
  x: number
  y: number
}

export class GizmoManager {
  private readonly gizmoEntity: Entity
  constructor(
    private readonly editorService: EditorService,
    private readonly element: StemElement
  ) {
    this.gizmoEntity = this.editorService.generateEntity()
  }

  addOrReplace(gizmo: ElementFunction, extraProps?: object) {
    this.editorService.replaceGizmo(this.gizmoEntity, gizmo, {
      ...this.getProps(),
      ...extraProps,
    })
  }

  update(extraProps?: object) {
    this.editorService.setElementCanvasProps(this.gizmoEntity, {
      ...this.getProps(),
      ...extraProps,
    })
  }

  private getProps() {
    return {
      points: this.element.geometryFn(),
      x: this.element.position.x,
      y: this.element.position.y,
    }
  }

  remove() {
    this.editorService.removeGizmo(this.gizmoEntity)
  }

  destroy() {
    this.editorService.removeEntity(this.gizmoEntity)
  }
}
