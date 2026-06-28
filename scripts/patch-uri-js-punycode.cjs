const fs = require("fs")
const path = require("path")

const files = [
  "node_modules/uri-js/dist/esnext/uri.js",
  "node_modules/uri-js/dist/esnext/schemes/mailto.js",
  "node_modules/uri-js/dist/es5/uri.all.js",
  "node_modules/uri-js/dist/es5/uri.all.min.js",
  "node_modules/tr46/index.js",
  "node_modules/whatwg-url/lib/url-state-machine.js",
]

for (const file of files) {
  const fullPath = path.join(process.cwd(), file)

  if (!fs.existsSync(fullPath)) {
    continue
  }

  const original = fs.readFileSync(fullPath, "utf8")
  const patched = original
    .replace(/from "punycode"/g, 'from "punycode/"')
    .replace(/from 'punycode'/g, "from 'punycode/'")
    .replace(/require\("punycode"\)/g, 'require("punycode/")')
    .replace(/require\('punycode'\)/g, "require('punycode/')")

  if (patched !== original) {
    fs.writeFileSync(fullPath, patched)
  }
}

const parcelPackageManager = path.join(
  process.cwd(),
  "node_modules/@parcel/package-manager/lib/index.js"
)

if (fs.existsSync(parcelPackageManager)) {
  const original = fs.readFileSync(parcelPackageManager, "utf8")
  const patched = original.replace(
    "        return require(filePath);",
    '        return require(filePath === "punycode" ? "punycode/" : filePath);'
  )

  if (patched !== original) {
    fs.writeFileSync(parcelPackageManager, patched)
  }
}
