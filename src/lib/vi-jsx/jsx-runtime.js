const jsxFragment = "jsx.Fragment"
const jsxTextNode = "jsx.Text"

// type TargetProps = {
//   name: string
//   id: string
//   x: number
//   y: number
//   attributes: Map<string, string | number>
//   classes: string[]
//   children?: (TargetProps | string)[]
// }

function jsx(tag, props) {
  if (typeof tag === "function") return tag(props)

  const targetProps = {
    name: tag,
    id: props.id,
    x: props["data-x"],
    y: props["data-y"],
    attributes: kebabize(props),
    classes: props.className ? props.className.split(" ") : [],
  }

  if (props.children) {
    targetProps.children = props.children
  }

  return {
    type: tag,
    props: targetProps,
    key: null,
  }
}

jsx.Fragment = jsxFragment
jsx.TextNode = jsxTextNode

export { jsx, jsx as jsxs, jsxFragment as Fragment }

const kebabize = (obj) => {
  const result = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      result[key.replace(/([A-Z])/g, "-$1").toLowerCase()] = value
    }
  }
  return result
}
