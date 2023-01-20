module.exports.readVersion = function readVersion(contents) {
  const parsed = JSON.parse(contents)
  return parsed.package.version
}

module.exports.writeVersion = function writeVersion(contents, version) {
  const parsed = JSON.parse(contents)
  parsed.package.version = version

  return JSON.stringify(parsed, null, 2)
}
