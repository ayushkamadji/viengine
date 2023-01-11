import {
  BaseUIPropType,
  ElementFunction,
} from "../ecs-systems/renderer-element"
import "./node-creation.css"

type MenuProps = BaseUIPropType & {
  items: string[]
}

export const Menu: ElementFunction = ({ x, y, items }: MenuProps) => {
  return (
    <div
      id="node-create-menu"
      className="node-create-menu"
      data-x={x}
      data-y={y}
    >
      {items.map((item, i) => {
        return <div key={i}>{item}</div>
      })}
    </div>
  )
}

export const ArrowDown = ({ x, y }: BaseUIPropType) => {
  return (
    <div id="down-arrow" data-x={x} data-y={y}>
      &#x25BC;
    </div>
  )
}
