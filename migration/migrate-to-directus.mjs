#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import process from "node:process"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import dotenv from "dotenv"
import { unified } from "unified"
import remarkParse from "remark-parse"
import toHast from "mdast-util-to-hast"
import raw from "hast-util-raw"
import toHtml from "hast-util-to-html"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, "..")
dotenv.config({ path: path.join(projectRoot, ".env.production") })
const directusSchema = JSON.parse(fs.readFileSync(path.join(scriptDir, "directus-schema.json"), "utf8")).data
const artworkMainImageField = directusSchema.fields.find(
  field => field.collection === "artworks" && field.field === "main_image"
)
const artworkDateField = directusSchema.fields.find(
  field => field.collection === "artworks" && field.field === "date"
)
const seriesMainImageField = directusSchema.fields.find(
  field => field.collection === "series" && field.field === "main_image"
)
const seriesSeoImageField = directusSchema.fields.find(
  field => field.collection === "series" && field.field === "seo_image"
)
const seriesDateField = directusSchema.fields.find(
  field => field.collection === "series" && field.field === "date"
)
const ARTWORKS_ASSET_FOLDER = artworkMainImageField?.meta?.options?.folder
const SERIES_ASSET_FOLDER = seriesMainImageField?.meta?.options?.folder
const FILE_MAP_PATH = path.join(scriptDir, ".migration-file-map.json")
const IS_DRY_RUN = process.argv.includes("--dry-run")

if (!ARTWORKS_ASSET_FOLDER) throw new Error("L'schema no defineix la folder d'artworks.main_image")
if (!SERIES_ASSET_FOLDER) throw new Error("L'schema no defineix la folder de series.main_image")
if (seriesSeoImageField?.meta?.options?.folder !== SERIES_ASSET_FOLDER) {
  throw new Error("series.main_image i series.seo_image no comparteixen folder; cal revisar el flux")
}
if (artworkDateField?.schema?.data_type !== "timestamp without time zone") {
  throw new Error("artworks.date ja no Ã©s timestamp without time zone; cal revisar la conversiÃ³")
}
if (seriesDateField?.schema?.data_type !== "timestamp without time zone") {
  throw new Error("series.date ja no és timestamp without time zone; cal revisar la conversió")
}

const VOCABULARY_MAP = {
  technique: {
    Acrylic: ["acrylic"],
    "Acrylic.withWaterColor": ["acrylic", "watercolor"],
  },
  styles: {
    Scratch: ["scratch"],
    Undefined: [],
    Abstract: ["abstract"],
    "Scratch.withFigurative": ["scratch", "figurative"],
    "Scratch.andFigurative": ["scratch", "figurative"],
    Textures: ["textures"],
  },
  surface: {
    Paper: ["paper"],
    wood: ["wood"],
  },
  composition: {
    Triptych: ["triptych"],
    Single: ["single"],
  },
}

const VOCABULARY_COLLECTIONS = {
  technique: { collection: "artwork_tecniques", referenceField: "reference", junctionField: "artwork_tecniques_id" },
  styles: { collection: "artwork_styles", referenceField: "reference", junctionField: "artwork_styles_id" },
  surface: { collection: "artwork_surfaces", referenceField: "reference", junctionField: "artwork_surfaces_id" },
  composition: { collection: "artwork_composition", referenceField: "reference", junctionField: null },
}
const AUTHORIZED_VOCABULARY_CREATES = {
  "artwork_styles:abstract": { collection: "artwork_styles", reference: "abstract", nameCa: "Abstracte" },
  "artwork_styles:textures": { collection: "artwork_styles", reference: "textures", nameCa: "Textures" },
  "artwork_surfaces:wood": { collection: "artwork_surfaces", reference: "wood", nameCa: "Fusta" },
}

function parseArguments(argv) {
  const result = { dryRun: false, reference: null, type: "artwork", collection: null }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === "--dry-run") result.dryRun = true
    else if (argument === "--reference") result.reference = argv[++index]
    else if (argument === "--type") result.type = argv[++index]
    else if (argument === "--collection") result.collection = argv[++index]
    else throw new Error(`Argument desconegut: ${argument}`)
  }
  if (!result.reference) throw new Error("Falta --reference <reference>")
  if (!["artwork", "series", "vocabulary"].includes(result.type)) throw new Error("Tipus no suportat")
  if (result.type === "vocabulary" && !result.collection) throw new Error("Falta --collection <collection>")
  return result
}

function requiredEnvironment() {
  const names = [
    "DIRECTUS_URL",
    "DIRECTUS_MIGRATION_TOKEN",
    "DIRECTUS_BASIC_AUTH_USER",
    "DIRECTUS_BASIC_AUTH_PASSWORD",
  ]
  const missing = names.filter(name => !process.env[name])
  if (missing.length) throw new Error(`Falten variables d'entorn: ${missing.join(", ")}`)
}

function directusUrl(relativePath, query = {}) {
  const url = new URL(relativePath, `${process.env.DIRECTUS_URL.replace(/\/$/, "")}/`)
  url.searchParams.set("access_token", process.env.DIRECTUS_MIGRATION_TOKEN)
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value))
  return url
}

function requestHeaders(extra = {}) {
  const credentials = Buffer.from(
    `${process.env.DIRECTUS_BASIC_AUTH_USER}:${process.env.DIRECTUS_BASIC_AUTH_PASSWORD}`
  ).toString("base64")
  return { Authorization: `Basic ${credentials}`, Accept: "application/json", ...extra }
}

async function directusRequest(relativePath, { method = "GET", query, body, headers } = {}) {
  if (IS_DRY_RUN && method !== "GET") throw new Error(`El dry-run ha bloquejat ${method} ${relativePath}`)
  const response = await fetch(directusUrl(relativePath, query), {
    method,
    headers: requestHeaders(headers),
    body,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload?.errors?.[0]?.message || `${response.status} ${response.statusText}`
    throw new Error(`Directus ${method} ${relativePath}: ${message}`)
  }
  return payload
}

async function findExact(collection, field, value, fields = `id,${field}`) {
  const payload = await directusRequest(`items/${collection}`, {
    query: {
      [`filter[${field}][_eq]`]: value,
      fields,
      limit: 2,
    },
  })
  const items = Array.isArray(payload.data) ? payload.data : []
  if (items.length > 1) throw new Error(`${collection}.${field} no Ã©s Ãºnic per ${value}`)
  return items[0] || null
}

function findSeriesFile(reference) {
  const seriesRoot = path.join(projectRoot, "content", "series")
  const matches = []
  for (const entry of fs.readdirSync(seriesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    for (const basename of ["serie.mdx", "serie.md"]) {
      const candidate = path.join(seriesRoot, entry.name, basename)
      if (!fs.existsSync(candidate)) continue
      const parsed = matter(fs.readFileSync(candidate, "utf8"))
      const candidateReference = parsed.data.reference || entry.name
      if (candidateReference === reference) matches.push({ filename: candidate, parsed })
    }
  }
  if (!matches.length) throw new Error(`No s'ha trobat la sèrie legacy: ${reference}`)
  if (matches.length > 1) throw new Error(`Reference legacy de sèrie duplicada: ${reference}`)
  return matches[0]
}
function findArtworkFile(reference) {
  const paintsRoot = path.join(projectRoot, "content", "paints")
  const matches = []
  for (const serieEntry of fs.readdirSync(paintsRoot, { withFileTypes: true })) {
    if (!serieEntry.isDirectory()) continue
    const seriePath = path.join(paintsRoot, serieEntry.name)
    for (const artworkEntry of fs.readdirSync(seriePath, { withFileTypes: true })) {
      if (!artworkEntry.isDirectory()) continue
      for (const filename of ["paint.mdx", "paint.md"]) {
        const candidate = path.join(seriePath, artworkEntry.name, filename)
        if (!fs.existsSync(candidate)) continue
        const parsed = matter(fs.readFileSync(candidate, "utf8"))
        const candidateReference = parsed.data.reference || artworkEntry.name
        if (candidateReference === reference) matches.push({ filename: candidate, parsed })
      }
    }
  }
  if (!matches.length) throw new Error(`No s'ha trobat l'artwork legacy: ${reference}`)
  if (matches.length > 1) throw new Error(`Reference legacy duplicada: ${reference}`)
  return matches[0]
}

function mdxIncidents(body) {
  const incidents = []
  const checks = [
    [/^\s*(?:import|export)\s/m, "import/export MDX"],
    [/<[A-Z][A-Za-z0-9_.:-]*(?:\s|\/?>)/, "component JSX"],
    [/<\/[A-Z][A-Za-z0-9_.:-]*\s*>/, "component JSX"],
    [/(^|[^\\])\{[^{}]+\}/m, "expressiÃ³ JSX/MDX"],
  ]
  for (const [expression, label] of checks) if (expression.test(body)) incidents.push(label)
  return [...new Set(incidents)]
}

function markdownToHtml(body) {
  const source = String(body || "").trim()
  if (!source) return { html: undefined, incidents: [] }
  const incidents = mdxIncidents(source)
  if (incidents.length) return { html: undefined, incidents }
  const mdast = unified().use(remarkParse).parse(source)
  const hast = raw(toHast(mdast, { allowDangerousHtml: true }))
  return { html: toHtml(hast, { allowDangerousHtml: true }), incidents: [] }
}

function madridNoon(value) {
  const source = value instanceof Date && !Number.isNaN(value.valueOf())
    ? value.toISOString().slice(0, 10)
    : String(value || "")
  const match = source.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (!match) return undefined
  const date = `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
  // PostgreSQL timestamp without time zone: preserve literal Europe/Madrid wall time, without offset.
  return `${date}T12:00:00`
}

function dimensionsFrom(sizes) {
  return (Array.isArray(sizes) ? sizes : []).map((size, index) => {
    const cm = size?.cm || {}
    if (cm.height === undefined || cm.width === undefined) {
      throw new Error(`sizes[${index}] no contÃ© cm.height i cm.width`)
    }
    const dimension = { sort: index + 1, height_cm: Number(cm.height), width_cm: Number(cm.width) }
    const depth = cm.depth ?? cm.breadth
    if (depth !== undefined && depth !== null) dimension.depth_cm = Number(depth)
    return dimension
  })
}

function translationFrom(data, bodyHtml, languageCode) {
  const translation = { languages_code: languageCode, title: data.title }
  if (data.subtitle !== undefined) translation.subtitle = data.subtitle
  if (data.description !== undefined) translation.description = data.description
  if (bodyHtml !== undefined) translation.body = bodyHtml
  if (data.quote?.author !== undefined) translation.quote_author = data.quote.author
  if (data.quote?.text !== undefined) translation.quote_text = data.quote.text
  if (data.wallLabel?.title !== undefined) translation.wall_label_title = data.wallLabel.title
  if (data.wallLabel?.subtitle !== undefined) translation.wall_label_subtitle = data.wallLabel.subtitle
  if (data.wallLabel?.description !== undefined) translation.wall_label_description = data.wallLabel.description
  if (data.seo?.description !== undefined) translation.seo_description = data.seo.description
  if (data.seo?.keywords !== undefined) translation.seo_keywords = data.seo.keywords
  if (data.image?.image_alt_text !== undefined) translation.image_alt_text = data.image.image_alt_text
  return translation
}

async function resolveVocabulary(kind, legacyValue, report) {
  if (legacyValue === undefined || legacyValue === null || legacyValue === "") return undefined
  const mapped = VOCABULARY_MAP[kind]?.[legacyValue]
  if (mapped === undefined) {
    throw new Error(`Mapping de vocabulari inexistent per ${kind}: ${legacyValue}`)
  }
  if (mapped.length === 0) return []

  const definition = VOCABULARY_COLLECTIONS[kind]
  const resolved = []
  for (const reference of mapped) {
    const item = await findExact(definition.collection, definition.referenceField, reference)
    if (!item) {
      throw new Error(`Dependència de vocabulari inexistent: ${definition.collection}.${reference}`)
    }
    resolved.push({ id: item.id, reference })
  }
  if (resolved.length !== mapped.length) {
    throw new Error(`Resolució incompleta de vocabulari per ${kind}: ${legacyValue}`)
  }
  return resolved
}

function filePlan(filename) {
  const content = fs.readFileSync(filename)
  return {
    path: path.relative(projectRoot, filename).replaceAll("\\", "/"),
    filename: path.basename(filename),
    size: content.length,
    sha256: crypto.createHash("sha256").update(content).digest("hex"),
  }
}

function loadFileMap() {
  if (!fs.existsSync(FILE_MAP_PATH)) return { version: 1, files: {} }
  const parsed = JSON.parse(fs.readFileSync(FILE_MAP_PATH, "utf8"))
  if (parsed?.version !== 1 || !parsed.files || typeof parsed.files !== "object") {
    throw new Error("Format invàlid a migration/.migration-file-map.json")
  }
  return parsed
}

function saveFileMap(fileMap) {
  const temporary = `${FILE_MAP_PATH}.tmp`
  fs.writeFileSync(temporary, `${JSON.stringify(fileMap, null, 2)}\n`, { encoding: "utf8", mode: 0o600 })
  fs.renameSync(temporary, FILE_MAP_PATH)
}

async function directusFileExists(id) {
  const payload = await directusRequest("files", {
    query: { "filter[id][_eq]": id, fields: "id,folder,filename_download,filesize,type", limit: 1 },
  })
  return Array.isArray(payload.data) ? payload.data[0] || null : null
}
async function uploadFile(filename, folder, cache, fileMap, uploadedFilesThisRun, report) {
  const plan = filePlan(filename)
  if (cache.has(plan.sha256)) {
    const cached = cache.get(plan.sha256)
    report.actions.push({ action: "reuse_file_this_run", sha256: plan.sha256, id: cached })
    return cached
  }

  const mapped = fileMap.files[plan.sha256]
  if (mapped?.id) {
    const existing = await directusFileExists(mapped.id)
    if (existing) {
      cache.set(plan.sha256, mapped.id)
      report.actions.push({ action: "reuse_migrated_file", sha256: plan.sha256, id: mapped.id, validated: true })
      return mapped.id
    }
    report.warnings.push(`Entrada obsoleta al file-map per ${plan.sha256}; ${mapped.id} ja no existeix`)
    if (!report.dryRun) {
      delete fileMap.files[plan.sha256]
      saveFileMap(fileMap)
    }
  }

  if (report.dryRun) {
    const plannedId = `<new-directus-file:${plan.sha256.slice(0, 12)}>`
    cache.set(plan.sha256, plannedId)
    report.actions.push({ action: "upload_file", folder, folderSource: "migration/directus-schema.json", file: plan })
    return plannedId
  }

  const content = fs.readFileSync(filename)
  const form = new FormData()
  form.append("folder", folder)
  const extension = path.extname(filename).toLowerCase()
  const mimeType = extension === ".png" ? "image/png"
    : extension === ".webp" ? "image/webp"
      : [".jpg", ".jpeg"].includes(extension) ? "image/jpeg"
        : "application/octet-stream"
  form.append("file", new Blob([content], { type: mimeType }), path.basename(filename))
  const payload = await directusRequest("files", { method: "POST", body: form })
  const fileId = payload.data?.id
  if (!fileId) throw new Error(`Directus no ha retornat UUID per ${plan.path}`)

  uploadedFilesThisRun.push({ id: fileId, sha256: plan.sha256 })
  cache.set(plan.sha256, fileId)
  fileMap.files[plan.sha256] = {
    id: fileId,
    filename: plan.filename,
    filesize: plan.size,
    folder,
  }
  saveFileMap(fileMap)
  report.created.push({ type: "file", id: fileId, source: plan.path, sha256: plan.sha256 })
  return fileId
}

async function rollbackUploadedFiles(uploadedFilesThisRun, fileMap, report, originalError) {
  for (const uploaded of [...uploadedFilesThisRun].reverse()) {
    try {
      await directusRequest(`files/${uploaded.id}`, { method: "DELETE" })
      if (fileMap.files[uploaded.sha256]?.id === uploaded.id) {
        delete fileMap.files[uploaded.sha256]
        saveFileMap(fileMap)
      }
      report.rolledBack.push({
        type: "file",
        id: uploaded.id,
        reason: `content creation failed: ${originalError.message}`,
      })
      report.created = report.created.filter(item => !(item.type === "file" && item.id === uploaded.id))
    } catch (rollbackError) {
      report.warnings.push(`Rollback del fitxer ${uploaded.id} fallit: ${rollbackError.message}`)
    }
  }
}
function buildBasePayload(data, effectiveReference, resolved, mainImageId, bodyHtml) {
  const payload = {
    reference: effectiveReference,
    status: data.hide === true ? "archived" : "published",
    main_image: mainImageId,
    translations: [translationFrom(data, bodyHtml, resolved.languageCode)],
    dimensions: dimensionsFrom(data.sizes),
  }
  if (data.order !== undefined) payload.sort = Number(data.order)
  if (data.date !== undefined) payload.date = madridNoon(data.date)
  if (data.showOnMainScreen !== undefined) payload.show_on_home = Boolean(data.showOnMainScreen)
  if (data.sellingData?.productState !== undefined) payload.sale_status = data.sellingData.productState
  if (data.sellingData?.showProductState !== undefined) payload.show_sale_status = Boolean(data.sellingData.showProductState)
  if (data.sellingData?.priceEur !== undefined) payload.price_eur = Number(data.sellingData.priceEur)
  if (data.sellingData?.showPrice !== undefined) payload.show_price = Boolean(data.sellingData.showPrice)
  if (data.quote?.author !== undefined) payload.quote_author = data.quote.author
  if (data.quote?.showQuote !== undefined) payload.show_quote = Boolean(data.quote.showQuote)
  if (resolved.serie) payload.primary_serie = resolved.serie.id
  if (resolved.composition?.[0]) payload.composition = resolved.composition[0].id
  if (resolved.technique?.length) payload.technique = resolved.technique.map(item => ({ artwork_tecniques_id: item.id }))
  if (resolved.styles?.length) payload.styles = resolved.styles.map(item => ({ artwork_styles_id: item.id }))
  if (resolved.surface?.length) payload.surface = resolved.surface.map(item => ({ artwork_surfaces_id: item.id }))
  return payload
}

async function runVocabulary(options, report) {
  const key = `${options.collection}:${options.reference}`
  const definition = AUTHORIZED_VOCABULARY_CREATES[key]
  if (!definition) throw new Error(`Vocabulari no autoritzat: ${key}`)

  const existing = await findExact(definition.collection, "reference", definition.reference)
  if (existing) {
    report.skipped.push({
      type: "vocabulary",
      collection: definition.collection,
      reference: definition.reference,
      reason: "reference already exists",
      id: existing.id,
    })
    return report
  }

  const catalan = await findExact("languages", "language", "ca", "code,language")
  if (!catalan?.code) throw new Error("No s'ha pogut resoldre languages.language=ca")
  const payload = {
    reference: definition.reference,
    translations: [{ languages_code: catalan.code, name: definition.nameCa }],
  }
  report.actions.push({
    action: "create_vocabulary_with_translation",
    endpoint: `/items/${definition.collection}`,
    payload,
  })
  if (options.dryRun) return report

  const created = await directusRequest(`items/${definition.collection}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  report.created.push({
    type: "vocabulary",
    collection: definition.collection,
    id: created.data?.id,
    reference: definition.reference,
  })
  return report
}
function buildSeriesPayload(data, effectiveReference, languageCode, mainImageId, seoImageId, bodyHtml) {
  const payload = {
    reference: effectiveReference,
    status: data.hide === true ? "archived" : "published",
    main_image: mainImageId,
    translations: [translationFrom(data, bodyHtml, languageCode)],
  }
  if (data.order !== undefined) payload.sort = Number(data.order)
  if (data.date !== undefined) payload.date = madridNoon(data.date)
  if (seoImageId !== undefined) payload.seo_image = seoImageId
  if (data.quote?.author !== undefined) payload.quote_author = data.quote.author
  if (data.quote?.showQuote !== undefined) payload.show_quote = Boolean(data.quote.showQuote)
  return payload
}

async function runSeries(options, report, fileMap, fileCache, uploadedFilesThisRun) {
  const { filename, parsed } = findSeriesFile(options.reference)
  const data = parsed.data
  const effectiveReference = data.reference || options.reference
  report.reference = effectiveReference
  const existing = await findExact("series", "reference", effectiveReference)
  if (existing) {
    report.skipped.push({ type: "series", reference: effectiveReference, reason: "reference already exists", id: existing.id })
    return report
  }

  const conversion = markdownToHtml(parsed.content)
  if (conversion.incidents.length) throw new Error(`MDX/JSX no convertible: ${conversion.incidents.join(", ")}`)
  const catalan = await findExact("languages", "language", "ca", "code,language")
  if (!catalan?.code) throw new Error("No s'ha pogut resoldre languages.language=ca")

  const mainRelative = data.image?.main
  if (!mainRelative) throw new Error("series.image.main és obligatori")
  const mainFilename = path.resolve(path.dirname(filename), mainRelative)
  if (!fs.existsSync(mainFilename)) throw new Error(`No existeix series.image.main: ${mainRelative}`)
  const mainImageId = await uploadFile(
    mainFilename, SERIES_ASSET_FOLDER, fileCache, fileMap, uploadedFilesThisRun, report
  )

  let seoImageId
  if (data.seo?.image) {
    const seoFilename = path.resolve(path.dirname(filename), data.seo.image)
    if (!fs.existsSync(seoFilename)) throw new Error(`No existeix series.seo.image: ${data.seo.image}`)
    seoImageId = await uploadFile(
      seoFilename, SERIES_ASSET_FOLDER, fileCache, fileMap, uploadedFilesThisRun, report
    )
  }

  const payload = buildSeriesPayload(
    data, effectiveReference, catalan.code, mainImageId, seoImageId, conversion.html
  )
  report.actions.push({
    action: "create_series_with_translation",
    endpoint: "/items/series",
    payload,
    source: path.relative(projectRoot, filename).replaceAll("\\", "/"),
  })
  if (options.dryRun) return report

  const created = await directusRequest("items/series", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  report.created.push({ type: "series", id: created.data?.id, reference: effectiveReference })
  return report
}
async function run() {
  const options = parseArguments(process.argv.slice(2))
  requiredEnvironment()
  const report = { mode: options.dryRun ? "dry-run" : "write", dryRun: options.dryRun, type: options.type, reference: options.reference, created: [], rolledBack: [], skipped: [], warnings: [], errors: [], actions: [] }
  const uploadedFilesThisRun = []
  const fileMap = loadFileMap()
  const fileCache = new Map()
  try {
    if (options.type === "vocabulary") {
      return await runVocabulary(options, report)
    }
    if (options.type === "series") {
      return await runSeries(options, report, fileMap, fileCache, uploadedFilesThisRun)
    }
    const { filename, parsed } = findArtworkFile(options.reference)
    const data = parsed.data
    const effectiveReference = data.reference || options.reference
    report.reference = effectiveReference
    const existing = await findExact("artworks", "reference", effectiveReference)
    if (existing) {
      report.skipped.push({ type: "artwork", reference: effectiveReference, reason: "reference already exists", id: existing.id })
      return report
    }
    const conversion = markdownToHtml(parsed.content)
    if (conversion.incidents.length) {
      throw new Error(`MDX/JSX no convertible: ${conversion.incidents.join(", ")}`)
    }

    const serieLegacy = data.classification?.serie
    if (!serieLegacy) throw new Error("classification.serie Ã©s obligatori per resoldre primary_serie")
    const serieReference = String(serieLegacy).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const resolved = {
      serie: null,
      languageCode: null,
      technique: await resolveVocabulary("technique", data.classification?.technique, report),
      styles: await resolveVocabulary("styles", data.classification?.style, report),
      surface: await resolveVocabulary("surface", data.classification?.surface, report),
      composition: await resolveVocabulary("composition", data.classification?.composition, report),
    }
    const serie = await findExact("series", "reference", serieReference)
    if (!serie) throw new Error(`La sèrie exacta no existeix a Directus: ${serieReference}`)
    resolved.serie = { id: serie.id, reference: serieReference }
    const catalan = await findExact("languages", "language", "ca", "code,language")
    if (!catalan?.code) throw new Error("No s'ha pogut resoldre languages.language=ca")
    resolved.languageCode = catalan.code

    const mainRelative = data.image?.main
    if (!mainRelative) throw new Error("image.main Ã©s obligatori")
    const mainFilename = path.resolve(path.dirname(filename), mainRelative)
    if (!fs.existsSync(mainFilename)) throw new Error(`No existeix image.main: ${mainRelative}`)
    const mainImageId = await uploadFile(
      mainFilename, ARTWORKS_ASSET_FOLDER, fileCache, fileMap, uploadedFilesThisRun, report
    )
    const payload = buildBasePayload(data, effectiveReference, resolved, mainImageId, conversion.html)
    report.actions.push({ action: "create_artwork_with_relations", endpoint: "/items/artworks", payload, resolved })

    if (options.dryRun) return report

    const created = await directusRequest("items/artworks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    report.created.push({ type: "artwork", id: created.data?.id, reference: effectiveReference })
    return report
  } catch (error) {
    if (!options.dryRun && uploadedFilesThisRun.length) {
      await rollbackUploadedFiles(uploadedFilesThisRun, fileMap, report, error)
    }
    report.errors.push(error.message)
    return report
  }
}

const report = await run().catch(error => ({
  mode: process.argv.includes("--dry-run") ? "dry-run" : "write",
  reference: null,
  created: [],
  rolledBack: [],
  skipped: [],
  warnings: [],
  errors: [error.message],
  actions: [],
}))

console.log(JSON.stringify(report, null, 2))
console.log(`CREATED: ${report.created.length}`)
console.log(`SKIPPED: ${report.skipped.length}`)
console.log(`WARNING: ${report.warnings.length}`)
console.log(`ERROR: ${report.errors.length}`)
if (report.errors.length) process.exitCode = 1
