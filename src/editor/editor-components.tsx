import { SVGProps } from "react"
import {
  BaseUIPropType,
  ElementFunction,
  SVGElementFunction,
} from "./ecs-systems/renderer-element"

export type GridPointProps = BaseUIPropType & {
  index: number
}

export const GridPoint: ElementFunction = ({
  x,
  y,
  index,
}: GridPointProps): JSX.Element => {
  return (
    <div
      id={`grid-point-${index}`}
      className="grid-point"
      data-x={x}
      data-y={y}
    ></div>
  )
}

export const Cursor: ElementFunction = ({ x, y, hidden }) => {
  return (
    <div
      id="ui-cursor"
      className={`ui-cursor${hidden ? " hidden" : ""}`}
      data-x={x}
      data-y={y}
    ></div>
  )
}

export const SVGNode: SVGElementFunction<SVGRectElement> = (
  props: SVGProps<SVGRectElement>
) => {
  return <rect {...props}></rect>
}

export const Hints: ElementFunction = ({
  items,
  minimize,
}: {
  items: [string, string][]
  minimize: boolean
}) => {
  if (minimize) {
    return (
      <div className="ui-hints minimize">
        <div>?</div>
      </div>
    )
  } else {
    return (
      <div className="ui-hints">
        {items &&
          items.flat().map((keyOrValue, index) => (
            <div key={index} className="ui-hints-item">
              {keyOrValue}
            </div>
          ))}
      </div>
    )
  }
}
