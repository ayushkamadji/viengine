import {
  BaseUIPropType,
  ElementFunction,
} from "../ecs-systems/renderer-element"
import "./root.css"

type MenuProps = MenuDataProps & {
  id: string
  className: string
}

type MenuDataProps = BaseUIPropType & {
  items: string[]
  selectedIndex: number
}

export const Menu: ElementFunction = ({
  id,
  className,
  x,
  y,
  items,
  selectedIndex,
}: MenuProps) => {
  return (
    <div id={id} className={className} data-x={x} data-y={y}>
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

export const NodeMenu = ({ x, y, items, selectedIndex }: MenuDataProps) => {
  return (
    <Menu
      id="node-create-menu"
      className="node-create-menu"
      x={x}
      y={y}
      items={items}
      selectedIndex={selectedIndex}
    />
  )
}

export const RootMenu = ({ x, y, items, selectedIndex }: MenuDataProps) => {
  return (
    <Menu
      id="root-menu"
      className="root-menu"
      x={x}
      y={y}
      items={items}
      selectedIndex={selectedIndex}
    />
  )
}

export const ArrowDown = ({ x, y }: BaseUIPropType) => {
  return (
    <div id="down-arrow" data-x={x} data-y={y}>
      &#x25BC;
    </div>
  )
}

export const MoveIcon = ({ x, y }: BaseUIPropType) => {
  return (
    <div id="down-arrow" data-x={x} data-y={y}>
      &#x2725;
    </div>
  )
}
