const toml = require("@iarna/toml")

function detectNewline(string) {
  if (typeof string !== "string") {
    throw new TypeError("Expected a string")
  }

  const newlines = string.match(/(?:\r?\n)/g) || []

  if (newlines.length === 0) {
    return
  }

  const crlf = newlines.filter((newline) => newline === "\r\n").length
  const lf = newlines.length - crlf

  return crlf > lf ? "\r\n" : "\n"
}

function findLineIndexWithVersion(lines) {
  let lineWithVersion = 0

  let keep = true
  while (keep) {
    const maybeLine = lines[lineWithVersion]
    if (maybeLine.match("version")) {
      keep = false
    } else {
      lineWithVersion += 1
    }
  }

  return lineWithVersion
}

module.exports.readName = function readName(contents) {
  const parsed = toml.parse(contents)
  return parsed.package.name
}

module.exports.readVersion = function readVersion(contents) {
  const parsed = toml.parse(contents)
  return parsed.package.version
}

module.exports.writeVersion = function writeVersion(contents, version) {
  const newline = detectNewline(contents)
  const byLine = contents.split(newline)
  const lineIndexWithVersion = findLineIndexWithVersion(byLine)

  const lineWithVersion = byLine[lineIndexWithVersion]
  byLine[lineIndexWithVersion] = lineWithVersion.replace(
    /".*?"/g,
    `"${version}"`
  )

  return byLine.join(newline)
}

module.exports.isPrivate = function isPrivate() {
  // standard-version should not do anything with cargo crates for sure,
  // thus, consider everything private
  return true
}
