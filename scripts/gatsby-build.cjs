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

const configuredCpuCount = env.GATSBY_CPU_COUNT || env.GATSBY_BUILD_CPU_COUNT
const shouldUseWindowsSafeDefault =
  process.platform === "win32" &&
  env.GATSBY_BUILD_SAFE_CPU !== "false" &&
  !configuredCpuCount

if (configuredCpuCount && configuredCpuCount !== "auto") {
  env.GATSBY_CPU_COUNT = configuredCpuCount
} else if (shouldUseWindowsSafeDefault) {
  env.GATSBY_CPU_COUNT = "1"
} else if (configuredCpuCount === "auto") {
  delete env.GATSBY_CPU_COUNT
}

console.log("Running Gatsby build via scripts/gatsby-build.cjs")

if (env.GATSBY_CPU_COUNT) {
  console.log(`Gatsby build CPU count: ${env.GATSBY_CPU_COUNT}`)
} else {
  console.log("Gatsby build CPU count: auto")
}

const result = spawnSync(process.execPath, [gatsbyCli, "build", ...process.argv.slice(2)], {
  env,
  stdio: "inherit",
})

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status || 0)
