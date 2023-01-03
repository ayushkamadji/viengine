import { EditorLayer, Util } from "./editor"
import {
  StaticUIRendererComponent,
  UIRendererComponent,
} from "./ecs-systems/render-system"

export const GridPoint = ({ i, j }) => {
  return (
    <div
      id={`grid-point-${i}-${j}`}
      className="grid-point"
      data-x={i * EditorLayer.GRID_GAP}
      data-y={j * EditorLayer.GRID_GAP}
    ></div>
  )
}

export class GridPointComponentFactory {
  static create(i, j): StaticUIRendererComponent {
    const element: JSX.Element = <GridPoint i={i} j={j} />
    const { name, id, classes, attributes, x, y } = element.props
    const componentElement = { name, id, classes, attributes }

    return new StaticUIRendererComponent(componentElement, x, y)
  }
}

export const Cursor = ({ row, col }) => {
  const [x, y] = Util.cursorColRowToCanvasXY(col, row)
  return <div id="ui-cursor" className="ui-cursor" data-x={x} data-y={y}></div>
}

export class CursorComponentFactory {
  static create(row, col): UIRendererComponent {
    const element: JSX.Element = <Cursor row={row} col={col} />
    const { name, id, classes, attributes, x, y } = element.props
    const componentElement = { name, id, classes, attributes }

    return new UIRendererComponent(componentElement, x, y)
  }
}
