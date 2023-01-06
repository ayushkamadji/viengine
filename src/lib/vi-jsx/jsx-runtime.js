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
  // const targetProps: TargetProps = {
  const targetProps = {
    name: tag,
    id: props.id,
    x: props["data-x"],
    y: props["data-y"],
    attributes: props,
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
