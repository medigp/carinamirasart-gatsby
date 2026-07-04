const { spawnSync } = require("child_process")
const path = require("path")

const gatsbyCli = path.join(
  process.cwd(),
  "node_modules",
  "gatsby",
  "cli.js"
)

const env = {
  ...process.env,
}

const configuredCpuCount = env.GATSBY_CPU_COUNT || env.GATSBY_DEVELOP_CPU_COUNT

if (configuredCpuCount && configuredCpuCount !== "auto") {
  env.GATSBY_CPU_COUNT = configuredCpuCount
} else if (configuredCpuCount === "auto") {
  delete env.GATSBY_CPU_COUNT
}

console.log("Running Gatsby develop via scripts/gatsby-develop.cjs")

if (env.GATSBY_CPU_COUNT) {
  console.log(`Gatsby develop CPU count: ${env.GATSBY_CPU_COUNT}`)
} else {
  console.log("Gatsby develop CPU count: auto")
}

const result = spawnSync(process.execPath, [gatsbyCli, "develop", ...process.argv.slice(2)], {
  env,
  stdio: "inherit",
})

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status || 0)
