import { Geometry } from "../../lib/util/geometry"
import { HIGHLIGHT_COLOR } from "./text-box-factory"

export const EditHighlightGizmo = ({ points }: { points: Geometry }) => {
  const pointArray = Array.isArray(points) ? points : [points.p1, points.p2]
  const props = {
    points: pointArray.map((p) => `${p.x},${p.y}`).join(" "),
    fill: "none",
    stroke: HIGHLIGHT_COLOR,
    "stroke-dasharray": "8 13",
    // TODO: React svg types wants everything in camel case,
    // whereas there are camel and kebab case attributes in SVG
    // Which means this needs manual mapping (reallyy SVG???!!!)
  }
  return (
    <g>
      <polygon {...props} />
    </g>
  )
}
