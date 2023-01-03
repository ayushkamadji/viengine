const jsxFragment = "jsx.Fragment"
const jsxTextNode = "jsx.Text"

function jsx(tag, props) {
  if (typeof tag === "function") return tag(props)
  const component = {
    name: tag,
    id: props.id,
    x: props["data-x"],
    y: props["data-y"],
    attributes: props,
    classes: props.className ? props.className.split(" ") : [],
  }

  if (props.children) {
    component.children = props.children
  }

  return {
    type: tag,
    props: component,
    key: null,
  }
}

jsx.Fragment = jsxFragment
jsx.TextNode = jsxTextNode

export { jsx, jsx as jsxs, jsxFragment as Fragment }
