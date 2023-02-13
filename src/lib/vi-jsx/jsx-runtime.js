export function jsx(tag, props, ...children) {
  if (tag === "Fragment" || tag === "fragment") {
    console.log("Fragment detected")
  }
  if (typeof tag === "function") return tag(props, children)

  if (typeof props.style === "object") {
    const kebabizedStyle = kebabize(props.style)
    props.style = Object.keys(kebabizedStyle)
      .map((key) => {
        return `${key}:${kebabizedStyle[key]}`
      })
      .join(";")
  }

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
