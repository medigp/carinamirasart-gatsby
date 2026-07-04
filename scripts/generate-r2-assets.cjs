const crypto = require("crypto")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")

const ROOT = process.cwd()
const DEFAULT_BASE_URL = "https://assets.carinamiras.art"
const DEFAULT_MANIFEST = path.join(ROOT, "src", "data", "generated", "r2-assets-manifest.json")
const DEFAULT_OUTPUT = path.join(ROOT, "generated-assets")
const WEB_WIDTHS = [400, 800, 1200, 1600]
const THUMB_WIDTH = 100
const WEBP_QUALITY = 84
const THUMB_QUALITY = 72

const args = parseArgs(process.argv.slice(2))
const workReference = args.work

if (!workReference) {
  fail("Cal indicar una obra amb --work <reference>.")
}

const prefix = trimSlashes(args.prefix || "")
const baseUrl = stripTrailingSlash(args.baseUrl || DEFAULT_BASE_URL)
const outputRoot = path.resolve(args.output || DEFAULT_OUTPUT)
const manifestPath = path.resolve(args.manifest || DEFAULT_MANIFEST)

run().catch((error) => {
  fail(error.stack || error.message)
})

async function run() {
  const work = findWork(workReference)
  const imageConfig = readImageConfig(work.mdxPath)
  const images = getImages(work.dir, imageConfig)

  if (!images.length) {
    fail(`No s'han trobat imatges per a ${workReference}.`)
  }

  const workManifest = {
    reference: workReference,
    source: path.relative(ROOT, work.dir).replace(/\\/g, "/"),
    prefix,
    images: {},
  }

  for (const image of images) {
    const sourcePath = path.join(work.dir, image.file)
    const imageManifest = await generateImageVariants({
      sourcePath,
      sourceName: path.parse(image.file).name,
      role: image.role,
      workReference,
      prefix,
      baseUrl,
      outputRoot,
    })

    workManifest.images[imageManifest.name] = imageManifest
  }

  const manifest = readManifest(manifestPath)
  manifest.baseUrl = baseUrl
  manifest.works = manifest.works || {}
  manifest.works[workReference] = workManifest

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
  fs.writeFileSync(manifestPath, `${JSON.stringify(sortObject(manifest), null, 2)}\n`)

  console.log(`Generats assets R2 locals per a ${workReference}:`)
  console.log(`- sortida: ${path.relative(ROOT, outputRoot)}`)
  console.log(`- manifest: ${path.relative(ROOT, manifestPath)}`)
  console.log(`- prefix R2 segur: ${buildR2Key(prefix, "obres", workReference)}`)
}

async function generateImageVariants({ sourcePath, sourceName, role, workReference, prefix, baseUrl, outputRoot }) {
  const metadata = await sharp(sourcePath).metadata()
  const sourceWidth = metadata.width || 0
  const targets = [
    { key: "thumb", width: Math.min(THUMB_WIDTH, sourceWidth || THUMB_WIDTH), quality: THUMB_QUALITY, thumb: true },
    ...WEB_WIDTHS.filter((width) => !sourceWidth || width <= sourceWidth).map((width) => ({
      key: `${width}w`,
      width,
      quality: WEBP_QUALITY,
      thumb: false,
    })),
  ]

  if (!targets.some((target) => !target.thumb) && sourceWidth) {
    targets.push({ key: `${sourceWidth}w`, width: sourceWidth, quality: WEBP_QUALITY, thumb: false })
  }

  const variants = {}

  for (const target of targets) {
    const buffer = await sharp(sourcePath)
      .rotate()
      .resize({ width: target.width, withoutEnlargement: true })
      .webp({ quality: target.quality })
      .toBuffer()
    const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 12)
    const fileName = `${workReference}-${sourceName}-${target.key}.${hash}.webp`
    const key = buildR2Key(prefix, "obres", workReference, fileName)
    const outputPath = path.join(outputRoot, key)

    fs.mkdirSync(path.dirname(outputPath), { recursive: true })

    if (!fs.existsSync(outputPath)) {
      fs.writeFileSync(outputPath, buffer)
    }

    const variantMetadata = await sharp(buffer).metadata()
    variants[target.key] = {
      key,
      url: `${baseUrl}/${key}`,
      width: variantMetadata.width,
      height: variantMetadata.height,
      format: "webp",
      bytes: buffer.length,
      hash,
    }
  }

  const displayVariants = Object.entries(variants)
    .filter(([key]) => key !== "thumb")
    .sort(([left], [right]) => parseInt(left, 10) - parseInt(right, 10))
  const fallback = displayVariants[Math.min(1, displayVariants.length - 1)] || displayVariants[0]
  const largest = displayVariants[displayVariants.length - 1] || fallback
  const thumb = variants.thumb

  return {
    name: sourceName,
    role,
    src: fallback ? fallback[1].url : thumb.url,
    srcSet: displayVariants.map(([, variant]) => `${variant.url} ${variant.width}w`).join(", "),
    width: largest ? largest[1].width : thumb.width,
    height: largest ? largest[1].height : thumb.height,
    thumb: thumb
      ? {
          src: thumb.url,
          width: thumb.width,
          height: thumb.height,
        }
      : null,
    variants,
  }
}

function findWork(reference) {
  const contentRoot = path.join(ROOT, "content", "paints")
  const mdxFiles = walk(contentRoot).filter((file) => path.basename(file) === "paint.mdx")
  const normalizedReference = normalizeValue(reference)

  for (const mdxPath of mdxFiles) {
    const text = fs.readFileSync(mdxPath, "utf8")
    const mdxReference = readScalar(text, "reference")
    const dirName = path.basename(path.dirname(mdxPath))

    if (normalizeValue(mdxReference) === normalizedReference || normalizeValue(dirName) === normalizedReference) {
      return {
        dir: path.dirname(mdxPath),
        mdxPath,
      }
    }
  }

  fail(`No s'ha trobat cap paint.mdx amb reference o carpeta '${reference}'.`)
}

function readImageConfig(mdxPath) {
  const text = fs.readFileSync(mdxPath, "utf8")
  const imageBlock = text.match(/image\s*:\s*{([\s\S]*?)}/)

  if (!imageBlock) {
    return null
  }

  const main = readScalar(imageBlock[1], "main")
  const otherImagesMatch = imageBlock[1].match(/otherImages\s*:\s*\[([\s\S]*?)\]/)
  const otherImages = otherImagesMatch
    ? otherImagesMatch[1]
        .split(",")
        .map((item) => normalizeValue(item))
        .filter(Boolean)
    : []

  return {
    main: normalizeValue(main),
    otherImages,
  }
}

function getImages(workDir, imageConfig) {
  if (imageConfig && imageConfig.main) {
    return [
      { file: imageConfig.main, role: "main" },
      ...imageConfig.otherImages.map((file) => ({ file, role: "other" })),
    ].filter((image) => fs.existsSync(path.join(workDir, image.file)))
  }

  return fs.readdirSync(workDir)
    .filter((file) => /\.(jpe?g|png)$/i.test(file))
    .sort((left, right) => left.localeCompare(right, "ca"))
    .map((file, index) => ({ file, role: index === 0 ? "main" : "other" }))
}

function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    return {
      baseUrl: DEFAULT_BASE_URL,
      works: {},
    }
  }

  return JSON.parse(fs.readFileSync(manifestPath, "utf8"))
}

function readScalar(text, key) {
  const match = text.match(new RegExp(`${key}\\s*:\\s*([^\\n,]+)`))
  return match ? normalizeValue(match[1]) : null
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
}

function trimSlashes(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "")
}

function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/g, "")
}

function buildR2Key(...parts) {
  return parts
    .map((part) => trimSlashes(part))
    .filter(Boolean)
    .join("/")
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(absolutePath) : absolutePath
  })
}

function parseArgs(argv) {
  const parsed = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (!arg.startsWith("--")) {
      continue
    }

    const key = arg.slice(2)
    const next = argv[index + 1]

    if (!next || next.startsWith("--")) {
      parsed[key] = true
    } else {
      parsed[key] = next
      index += 1
    }
  }

  return parsed
}

function sortObject(value) {
  if (Array.isArray(value)) {
    return value.map(sortObject)
  }

  if (!value || typeof value !== "object") {
    return value
  }

  return Object.keys(value)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = sortObject(value[key])
      return sorted
    }, {})
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
