import {
  BaseUIPropType,
  ElementFunction,
} from "../ecs-systems/renderer-element"
import "./node-creation.css"

type MenuProps = BaseUIPropType & {
  items: string[]
  selectedIndex: number
}

export const Menu: ElementFunction = ({
  x,
  y,
  items,
  selectedIndex,
}: MenuProps) => {
  return (
    <div
      id="node-create-menu"
      className="node-create-menu"
      data-x={x}
      data-y={y}
    >
      {items.map((item, i) => {
        const highlightClass = i === selectedIndex ? "highlight" : ""
        return (
          <div className={highlightClass} key={i}>
            {item}
          </div>
        )
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
