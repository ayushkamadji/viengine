export function jsx(tag, props, ...children) {
  if (tag === "Fragment" || tag === "fragment") {
    console.log("Fragment detected")
  }
  if (typeof tag === "function") return tag(props, children)

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

export const Fragment = function (props, ..._children) {
  // console.log("FRAGMENT")
  return props.children
}

export const jsxs = jsx
