#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import process from "node:process"
import { spawnSync } from "node:child_process"
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
const pageSeoImageField = directusSchema.fields.find(
  field => field.collection === "pages" && field.field === "seo_image"
)
const biographyImageField = directusSchema.fields.find(
  field => field.collection === "biography_events" && field.field === "image"
)
const biographyReferenceDateField = directusSchema.fields.find(
  field => field.collection === "biography_events" && field.field === "reference_date"
)
const pressReferenceDateField = directusSchema.fields.find(
  field => field.collection === "press_articles" && field.field === "reference_date"
)
const PAGES_ASSET_FOLDER = pageSeoImageField?.meta?.options?.folder ?? null
const BIOGRAPHY_ASSET_FOLDER = biographyImageField?.meta?.options?.folder ?? null
const EXCLUDED_PAGE_REFERENCES = new Set(["exhibitions", "reviews"])
const artworkSaleStatusField = directusSchema.fields.find(
  field => field.collection === "artworks" && field.field === "sale_status"
)
const ARTWORK_SALE_STATUSES = new Set(
  (artworkSaleStatusField?.meta?.options?.choices || []).map(choice => choice.value)
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
  throw new Error("artworks.date ja no és timestamp without time zone; cal revisar la conversió")
}
if (seriesDateField?.schema?.data_type !== "timestamp without time zone") {
  throw new Error("series.date ja no és timestamp without time zone; cal revisar la conversió")
}
if (biographyReferenceDateField?.schema?.data_type !== "timestamp without time zone") {
  throw new Error("biography_events.reference_date ja no és timestamp without time zone; cal revisar la conversió")
}
if (pressReferenceDateField?.schema?.data_type !== "timestamp without time zone") {
  throw new Error("press_articles.reference_date ja no és timestamp without time zone; cal revisar la conversió")
}

const BIOGRAPHY_EXISTING_REFERENCE_OVERRIDES = Object.freeze({
  0: "1986-born",
  1: "2001-classes",
  2: "2002-studies",
  3: "2004-belles-arts",
  4: "2006-usa",
  5: "2008-curtmetatges",
  6: "2010-llicenciada",
  7: "2013-photo",
  8: "2013-teaching",
  9: "2014-patinadora",
  10: "2015-teaching",
  11: "2015-nepal",
  12: "2019-artista-visual",
})

const PRESS_EXISTING_REFERENCE_OVERRIDES = Object.freeze({
  0: "beopen", 1: "marato-2021", 2: "vallenc-20230110",
  3: "vallenc-20230410", 4: "vallenc-20230414", 29: "obertament-ressonancies",
})

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
// Correccions explícites de referències legacy malformades, verificades contra
// els fitxers físics. No s'aplica cap normalització heurística a altres obres.
const OTHER_IMAGE_OVERRIDES = Object.freeze({
  "follow-the-sun": ["02.jpg", "03.jpg", "04.jpg", "05.jpg"],
  iraia: ["02.jpg", "03.jpg", "04.jpg", "05.jpg"],
  "vandana-shiva": ["02.jpg", "03.jpg"],
})

function parseArguments(argv) {
  const result = { dryRun: false, all: false, confirmBatch: false, reference: null, type: "artwork", collection: null }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === "--dry-run") result.dryRun = true
    else if (argument === "--all") result.all = true
    else if (argument === "--confirm-batch") result.confirmBatch = true
    else if (argument === "--reference") result.reference = argv[++index]
    else if (argument === "--type") result.type = argv[++index]
    else if (argument === "--collection") result.collection = argv[++index]
    else throw new Error(`Argument desconegut: ${argument}`)
  }
  if (result.all && result.reference) throw new Error("--all i --reference són incompatibles")
  if (result.all && !["artwork", "pages", "biography", "press"].includes(result.type)) throw new Error("--all només està suportat amb --type artwork, pages, biography o press")
  if (result.type === "pages" && result.all && !result.dryRun) throw new Error("--type pages --all només està suportat amb --dry-run")
  if (["artwork", "biography", "press"].includes(result.type) && result.all && !result.dryRun && !result.confirmBatch) {
    throw new Error("El batch real requereix --confirm-batch")
  }
  if (result.confirmBatch && (!result.all || result.dryRun || !["artwork", "biography", "press"].includes(result.type))) {
    throw new Error("--confirm-batch només és vàlid per --type artwork, biography o press --all sense --dry-run")
  }
  if (!result.all && !result.reference) throw new Error("Falta --reference <reference>")
  if (!["artwork", "series", "vocabulary", "pages", "biography", "press"].includes(result.type)) throw new Error("Tipus no suportat")
  if (result.type === "vocabulary" && !result.collection) throw new Error("Falta --collection <collection>")
  return result
}

function listArtworkEntries() {
  const paintsRoot = path.join(projectRoot, "content", "paints")
  const entries = []
  for (const serieEntry of fs.readdirSync(paintsRoot, { withFileTypes: true })) {
    if (!serieEntry.isDirectory()) continue
    const seriePath = path.join(paintsRoot, serieEntry.name)
    for (const artworkEntry of fs.readdirSync(seriePath, { withFileTypes: true })) {
      if (!artworkEntry.isDirectory()) continue
      for (const basename of ["paint.mdx", "paint.md"]) {
        const filename = path.join(seriePath, artworkEntry.name, basename)
        if (!fs.existsSync(filename)) continue
        const parsed = matter(fs.readFileSync(filename, "utf8"))
        entries.push({ filename, reference: parsed.data.reference || artworkEntry.name })
      }
    }
  }
  return entries.sort((left, right) => left.reference.localeCompare(right.reference))
}
function listPageEntries() {
  const pagesRoot = path.join(projectRoot, "content", "pageTexts")
  const entries = []
  for (const pageEntry of fs.readdirSync(pagesRoot, { withFileTypes: true })) {
    if (!pageEntry.isDirectory()) continue
    for (const basename of [pageEntry.name + ".mdx", pageEntry.name + ".md", "page.mdx", "page.md"]) {
      const filename = path.join(pagesRoot, pageEntry.name, basename)
      if (!fs.existsSync(filename)) continue
      const parsed = matter(fs.readFileSync(filename, "utf8"))
      entries.push({ filename, reference: parsed.data.reference || pageEntry.name })
      break
    }
  }
  return entries.sort((left, right) => left.reference.localeCompare(right.reference))
}

function findPageFile(reference) {
  const matches = listPageEntries().filter(entry => entry.reference === reference)
  if (!matches.length) throw new Error("No s'ha trobat la page legacy: " + reference)
  if (matches.length > 1) throw new Error("Reference legacy de page duplicada: " + reference)
  const filename = matches[0].filename
  return { filename, parsed: matter(fs.readFileSync(filename, "utf8")) }
}
function listBiographyEntries() {
  const filename = path.join(projectRoot, "content", "pageTexts", "about", "about.mdx")
  if (!fs.existsSync(filename)) throw new Error("No existeix content/pageTexts/about/about.mdx")
  const parsed = matter(fs.readFileSync(filename, "utf8"))
  if (!Array.isArray(parsed.data.paragraphs)) throw new Error("about.paragraphs no és un array")
  const generatedCollisions = new Map()
  return parsed.data.paragraphs.map((paragraph, index) => {
    const yearLabel = String(paragraph?.title ?? "")
    if (!/^\d{4}$/.test(yearLabel)) throw new Error(`about.paragraphs[${index}].title no és un any complet: ${yearLabel}`)
    const referenceDate = `${yearLabel}-01-01T12:00:00`
    let reference = BIOGRAPHY_EXISTING_REFERENCE_OVERRIDES[index]
    if (!reference) {
      const base = `${yearLabel}0101`
      const occurrence = (generatedCollisions.get(base) || 0) + 1
      generatedCollisions.set(base, occurrence)
      reference = occurrence === 1 ? base : `${base}-${String(occurrence).padStart(2, "0")}`
    }
    return { filename, index, paragraph, reference, referenceDate, yearLabel }
  })
}

function findBiographyEntry(reference) {
  const matches = listBiographyEntries().filter(entry => entry.reference === reference)
  if (!matches.length) throw new Error(`No s'ha trobat l'event biogràfic legacy: ${reference}`)
  if (matches.length > 1) throw new Error(`Reference biogràfica duplicada: ${reference}`)
  return matches[0]
}

function normalizeLegacyDate(value, label) {
  const match = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!match) throw new Error(`${label} no és una data YYYY-M-D vàlida: ${value}`)
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3])
  const candidate = new Date(Date.UTC(year, month - 1, day))
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) throw new Error(`${label} no és una data de calendari vàlida: ${value}`)
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function listPressEntries() {
  const filename = path.join(projectRoot, "content", "pageTexts", "press", "press.mdx")
  if (!fs.existsSync(filename)) throw new Error("No existeix content/pageTexts/press/press.mdx")
  const parsed = matter(fs.readFileSync(filename, "utf8"))
  if (!Array.isArray(parsed.data.paragraphs)) throw new Error("press.paragraphs no és un array")
  const generatedCollisions = new Map()
  return parsed.data.paragraphs.map((paragraph, index) => {
    const normalizedDate = normalizeLegacyDate(paragraph?.date, `press.paragraphs[${index}].date`)
    let reference = PRESS_EXISTING_REFERENCE_OVERRIDES[index]
    if (!reference) { const base = normalizedDate.replaceAll("-", ""), occurrence = (generatedCollisions.get(base) || 0) + 1; generatedCollisions.set(base, occurrence); reference = occurrence === 1 ? base : `${base}-${String(occurrence).padStart(2, "0")}` }
    return { filename, index, paragraph, reference, normalizedDate, referenceDate: `${normalizedDate}T12:00:00`, existingOverride: Boolean(PRESS_EXISTING_REFERENCE_OVERRIDES[index]) }
  })
}
function findPressEntry(reference) {
  const matches = listPressEntries().filter(entry => entry.reference === reference)
  if (!matches.length) throw new Error(`No s'ha trobat l'article de premsa legacy: ${reference}`)
  if (matches.length > 1) throw new Error(`Reference de premsa duplicada: ${reference}`)
  return matches[0]
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
  if (items.length > 1) throw new Error(`${collection}.${field} no és únic per ${value}`)
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
    [/(^|[^\\])\{[^{}]+\}/m, "expressió JSX/MDX"],
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
      throw new Error(`sizes[${index}] no conté cm.height i cm.width`)
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
    report.actions.push({ action: "reuse_file_this_run", disposition: "REUSE_THIS_RUN", sha256: plan.sha256, id: cached })
    return cached
  }

  const mapped = fileMap.files[plan.sha256]
  if (mapped?.id) {
    const existing = await directusFileExists(mapped.id)
    if (existing) {
      cache.set(plan.sha256, mapped.id)
      report.actions.push({ action: "reuse_migrated_file", disposition: "REUSE_MIGRATED", sha256: plan.sha256, id: mapped.id, validated: true })
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
    report.actions.push({ action: "upload_file", disposition: "UPLOAD", folder, folderSource: "migration/directus-schema.json", file: plan })
    return plannedId
  }

  const content = fs.readFileSync(filename)
  const form = new FormData()
  if (folder) form.append("folder", folder)
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
function buildBasePayload(
  data,
  effectiveReference,
  resolved,
  mainImageId,
  seoImageId,
  otherImageIds,
  bodyHtml
) {
  const payload = {
    reference: effectiveReference,
    status: data.hide === true ? "archived" : "published",
    main_image: mainImageId,
    translations: [translationFrom(data, bodyHtml, resolved.languageCode)],
    dimensions: dimensionsFrom(data.sizes),
  }
  if (seoImageId !== undefined) payload.seo_image = seoImageId
  if (otherImageIds.length) {
    payload.other_images = otherImageIds.map((id, index) => ({
      directus_files_id: id,
      sort: index + 1,
    }))
  }
  if (data.order !== undefined) payload.sort = Number(data.order)
  if (data.date !== undefined) payload.date = madridNoon(data.date)
  if (data.showOnMainScreen !== undefined) payload.show_on_home = Boolean(data.showOnMainScreen)
  if (data.sellingData?.productState !== undefined) {
    if (!ARTWORK_SALE_STATUSES.has(data.sellingData.productState)) {
      throw new Error("sellingData.productState fora de l'enum Directus: " + data.sellingData.productState)
    }
    payload.sale_status = data.sellingData.productState
  }
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
function pageTranslationFrom(data, bodyHtml, languageCode) {
  const translation = { languages_code: languageCode }
  if (data.title !== undefined) translation.title = data.title
  if (data.subtitle !== undefined) translation.subtitle = data.subtitle
  if (bodyHtml !== undefined) translation.body = bodyHtml
  if (data.seo?.description !== undefined) translation.seo_description = data.seo.description
  if (data.seo?.keywords !== undefined) translation.seo_keywords = data.seo.keywords
  return translation
}

async function runPage(options, report, fileMap, fileCache, uploadedFilesThisRun) {
  const { filename, parsed } = findPageFile(options.reference)
  const data = parsed.data
  const effectiveReference = data.reference || options.reference
  report.reference = effectiveReference

  if (EXCLUDED_PAGE_REFERENCES.has(effectiveReference)) {
    throw new Error("Page exclosa explícitament de la migració legacy: " + effectiveReference)
  }

  const existing = await findExact("pages", "reference", effectiveReference)
  if (existing) {
    report.skipped.push({ type: "pages", reference: effectiveReference, reason: "reference already exists", id: existing.id })
    return report
  }

  const paragraphs = data.paragraphs
  if (paragraphs !== undefined && !Array.isArray(paragraphs)) {
    throw new Error("paragraphs ha de ser un array: " + effectiveReference)
  }
  if (paragraphs?.length) {
    if (effectiveReference === "about" || effectiveReference === "press") {
      throw new Error("paragraphs[] pertany a una migració posterior, no a pages: " + effectiveReference)
    }
    throw new Error("paragraphs[] sense mapping aprovat per pages: " + effectiveReference)
  }

  const conversion = markdownToHtml(parsed.content)
  if (conversion.incidents.length) {
    throw new Error("MDX/JSX no convertible: " + conversion.incidents.join(", "))
  }

  const catalan = await findExact("languages", "language", "ca", "code,language")
  if (!catalan?.code) throw new Error("No s'ha pogut resoldre languages.language=ca")

  let seoImageId
  if (data.seo?.image) {
    const seoFilename = path.resolve(path.dirname(filename), String(data.seo.image))
    if (!fs.existsSync(seoFilename)) throw new Error("No existeix seo.image: " + data.seo.image)
    seoImageId = await uploadFile(
      seoFilename, PAGES_ASSET_FOLDER, fileCache, fileMap, uploadedFilesThisRun, report
    )
  }

  const payload = {
    reference: effectiveReference,
    status: data.hide === true ? "archived" : "published",
    translations: [pageTranslationFrom(data, conversion.html, catalan.code)],
  }
  if (seoImageId !== undefined) payload.seo_image = seoImageId

  report.actions.push({
    action: "create_page_with_translation",
    endpoint: "/items/pages",
    payload,
    source: path.relative(projectRoot, filename).replaceAll("\\", "/"),
    schemaFolder: PAGES_ASSET_FOLDER,
  })
  if (options.dryRun) return report

  const created = await directusRequest("items/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  report.created.push({ type: "pages", id: created.data?.id, reference: effectiveReference })
  return report
}

function pressTranslation(paragraph, languageCode, descriptionHtml) {
  const translation = { languages_code: languageCode, title: paragraph.title }
  if (descriptionHtml !== undefined) translation.description = descriptionHtml
  return translation
}
async function runPress(options, report) {
  const entry = findPressEntry(options.reference)
  const { filename, index, paragraph, reference, referenceDate, existingOverride } = entry
  report.reference = reference
  if (typeof paragraph.title !== "string" || !paragraph.title.trim()) throw new Error(`press.paragraphs[${index}].title és obligatori`)
  if (typeof paragraph.author !== "string" || !paragraph.author.trim()) throw new Error(`press.paragraphs[${index}].author és obligatori`)
  if (typeof paragraph.link !== "string" || !paragraph.link.trim()) throw new Error(`press.paragraphs[${index}].link és obligatori`)
  try { new URL(paragraph.link) } catch { throw new Error(`press.paragraphs[${index}].link no és una URL vàlida: ${paragraph.link}`) }
  const catalan = await findExact("languages", "language", "ca", "code,language")
  if (!catalan?.code) throw new Error("No s'ha pogut resoldre languages.language=ca")
  const existing = await findExact("press_articles", "reference", reference, "id,reference,status,media,author,external_url,translations.languages_code,translations.title,translations.external_url")
  if (existing) {
    const translation = (existing.translations || []).find(item => item.languages_code === catalan.code)
    const urlMatches = (existing.external_url || translation?.external_url) === paragraph.link
    const titleMatches = translation?.title === paragraph.title
    const authorMediaMatches = existing.author === paragraph.author || existing.media === paragraph.author
    if (!urlMatches || (!titleMatches && !authorMediaMatches)) throw new Error(`La reference existent ${reference} no correspon inequívocament a press.paragraphs[${index}]`)
    report.actions.push({ action: existingOverride ? "validate_existing_press_override" : "validate_existing_generated_press_reference", reference, legacyIndex: index, id: existing.id, comparison: { urlMatches, titleMatches, authorMediaMatches }, authoritativeStatus: existing.status })
    report.skipped.push({ type: "press", reference, reason: "reference already exists and matches legacy article", id: existing.id })
    return report
  }
  if (existingOverride) throw new Error(`L'override press.paragraphs[${index}] → ${reference} ja no existeix a Directus`)
  const conversion = markdownToHtml(paragraph.text)
  if (conversion.incidents.length) throw new Error(`MDX/JSX no convertible a press.paragraphs[${index}].text: ${conversion.incidents.join(", ")}`)
  const payload = { reference, reference_date: referenceDate, sort: index + 1, status: "published", media: paragraph.author, author: paragraph.author, external_url: paragraph.link, translations: [pressTranslation(paragraph, catalan.code, conversion.html)] }
  report.actions.push({ action: options.dryRun ? "would_create_press_with_translation" : "create_press_with_translation", endpoint: "/items/press_articles", payload, source: path.relative(projectRoot, filename).replaceAll("\\", "/"), legacyIndex: index, sortText: `${entry.normalizedDate}-sort-${String(index + 1).padStart(10, "0")}` })
  if (options.dryRun) return report
  const created = await directusRequest("items/press_articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
  report.created.push({ type: "press", id: created.data?.id, reference })
  return report
}
function runAllPress(options) {
  const entries = listPressEntries()
  const report = {
    mode: options.dryRun ? "dry-run" : "write",
    dryRun: options.dryRun,
    type: "press",
    all: true,
    created: [], rolledBack: [], skipped: [], warnings: [], errors: [], actions: [], results: [],
  }
  for (const entry of entries) {
    const childArguments = [fileURLToPath(import.meta.url), "--type", "press", "--reference", entry.reference]
    if (options.dryRun) childArguments.splice(1, 0, "--dry-run")
    const child = spawnSync(process.execPath, childArguments, {
      cwd: projectRoot,
      env: { ...process.env, MIGRATION_JSON_ONLY: "1" },
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    })
    let item
    try {
      item = JSON.parse(child.stdout)
    } catch {
      item = {
        created: [], rolledBack: [], skipped: [], warnings: [], actions: [],
        errors: ["No s'ha pogut interpretar el resultat de press" + (child.stderr ? ": " + child.stderr.trim() : "")],
      }
    }
    const created = item.created || []
    const rolledBack = item.rolledBack || []
    const skipped = item.skipped || []
    const warnings = item.warnings || []
    const errors = item.errors || []
    const actions = item.actions || []
    const articleCreated = created.some(item => item.type === "press")
    const status = errors.length
      ? "ERROR"
      : skipped.length
        ? "SKIPPED"
        : warnings.length
          ? "WARNING"
          : options.dryRun
            ? "WOULD_CREATE"
            : articleCreated
              ? "CREATED"
              : "ERROR"
    const normalizedErrors = status === "ERROR" && !errors.length
      ? ["L'execució no ha creat ni omès l'article de premsa"]
      : errors
    report.results.push({ reference: entry.reference, legacyIndex: entry.index, status, warnings, errors: normalizedErrors })
    report.created.push(...created)
    report.rolledBack.push(...rolledBack)
    report.skipped.push(...skipped)
    report.actions.push(...actions)
    if (warnings.length) report.warnings.push({ reference: entry.reference, reasons: warnings })
    if (normalizedErrors.length) report.errors.push({ reference: entry.reference, reasons: normalizedErrors })
  }
  const createdReferences = report.created.filter(item => item.type === "press").map(item => item.reference)
  report.summary = {
    TOTAL: entries.length,
    WOULD_CREATE: report.results.filter(item => item.status === "WOULD_CREATE").length,
    CREATED_ARTICLES: createdReferences.length,
    SKIPPED: report.results.filter(item => item.status === "SKIPPED").length,
    WARNINGS: report.results.filter(item => item.status === "WARNING").length,
    ERRORS: report.results.filter(item => item.status === "ERROR").length,
    FILES_UPLOADED: report.created.filter(item => item.type === "file").length,
    FILES_REUSED: report.actions.filter(action => String(action.disposition || "").startsWith("REUSE")).length,
    FILES_ROLLED_BACK: report.rolledBack.filter(item => item.type === "file").length,
  }
  report.createdReferences = createdReferences
  report.wouldCreateReferences = report.results.filter(item => item.status === "WOULD_CREATE").map(item => item.reference)
  report.skippedReferences = report.results.filter(item => item.status === "SKIPPED").map(item => item.reference)
  report.warningReferences = report.results.filter(item => item.status === "WARNING").map(item => ({ reference: item.reference, reasons: item.warnings }))
  report.errorReferences = report.results.filter(item => item.status === "ERROR").map(item => ({ reference: item.reference, reasons: item.errors }))
  return report
}

function biographyTranslation(paragraph, yearLabel, languageCode, descriptionHtml) {
  const translation = {
    languages_code: languageCode,
    year_label: yearLabel,
    title: yearLabel,
  }
  if (paragraph.subtitle !== undefined && paragraph.subtitle !== null && paragraph.subtitle !== "") {
    translation.subtitle = paragraph.subtitle
  }
  if (descriptionHtml !== undefined) translation.description = descriptionHtml
  return translation
}

async function runBiography(options, report, fileMap, fileCache, uploadedFilesThisRun) {
  const entry = findBiographyEntry(options.reference)
  const { filename, index, paragraph, reference, referenceDate, yearLabel } = entry
  report.reference = reference

  const catalan = await findExact("languages", "language", "ca", "code,language")
  if (!catalan?.code) throw new Error("No s'ha pogut resoldre languages.language=ca")

  const existing = await findExact(
    "biography_events",
    "reference",
    reference,
    "id,reference,reference_date,status,sort,translations.languages_code,translations.year_label,translations.title,translations.subtitle,translations.description"
  )
  if (existing) {
    const translation = (existing.translations || []).find(item => item.languages_code === catalan.code)
    const comparison = {
      expected: { year_label: yearLabel, title: yearLabel },
      actual: translation ? { year_label: translation.year_label, title: translation.title } : null,
      matches: Boolean(translation && translation.year_label === yearLabel && translation.title === yearLabel),
    }
    report.actions.push({ action: "compare_existing_biography", reference, id: existing.id, existing, comparison })
    if (!comparison.matches) report.warnings.push(`L'event existent ${reference} no coincideix en year_label/title ca`)
    report.skipped.push({ type: "biography", reference, reason: "reference already exists", id: existing.id })
    return report
  }

  const conversion = markdownToHtml(paragraph.text)
  if (conversion.incidents.length) {
    throw new Error(`MDX/JSX no convertible a about.paragraphs[${index}].text: ${conversion.incidents.join(", ")}`)
  }

  let imageId
  if (paragraph.image !== undefined && paragraph.image !== null && paragraph.image !== "") {
    const imageFilename = path.resolve(path.dirname(filename), String(paragraph.image))
    if (!fs.existsSync(imageFilename)) throw new Error(`No existeix about.paragraphs[${index}].image: ${paragraph.image}`)
    imageId = await uploadFile(
      imageFilename, BIOGRAPHY_ASSET_FOLDER, fileCache, fileMap, uploadedFilesThisRun, report
    )
  }

  const payload = {
    reference,
    reference_date: referenceDate,
    sort: index + 1,
    status: "published",
    translations: [biographyTranslation(paragraph, yearLabel, catalan.code, conversion.html)],
  }
  if (imageId !== undefined) payload.image = imageId

  report.actions.push({
    action: "create_biography_with_translation",
    endpoint: "/items/biography_events",
    payload,
    source: path.relative(projectRoot, filename).replaceAll("\\", "/"),
    legacyIndex: index,
    excluded: paragraph._subtitle === undefined ? [] : ["_subtitle"],
    schemaFolder: BIOGRAPHY_ASSET_FOLDER,
  })
  if (options.dryRun) return report

  const created = await directusRequest("items/biography_events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  report.created.push({ type: "biography", id: created.data?.id, reference })
  return report
}

function runAllBiography(options) {
  const entries = listBiographyEntries()
  const report = {
    mode: options.dryRun ? "dry-run" : "write",
    dryRun: options.dryRun,
    type: "biography",
    all: true,
    created: [], rolledBack: [], skipped: [], warnings: [], errors: [], actions: [], results: [],
  }

  for (const entry of entries) {
    // Cada event s'executa en un procés aïllat. El rollback i els uploads
    // d'aquesta execució no poden afectar events anteriors. El file-map
    // SHA-256 continua sent persistent i compartit entre processos.
    const childArguments = [
      fileURLToPath(import.meta.url), "--type", "biography", "--reference", entry.reference,
    ]
    if (options.dryRun) childArguments.splice(1, 0, "--dry-run")
    const child = spawnSync(process.execPath, childArguments, {
      cwd: projectRoot,
      env: { ...process.env, MIGRATION_JSON_ONLY: "1" },
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    })

    let item
    try {
      item = JSON.parse(child.stdout)
    } catch {
      item = {
        created: [], rolledBack: [], skipped: [], warnings: [], actions: [],
        errors: ["No s'ha pogut interpretar el resultat de biography" + (child.stderr ? ": " + child.stderr.trim() : "")],
      }
    }

    const created = item.created || []
    const rolledBack = item.rolledBack || []
    const skipped = item.skipped || []
    const warnings = item.warnings || []
    const errors = item.errors || []
    const actions = item.actions || []
    const eventCreated = created.some(createdItem => createdItem.type === "biography")
    const status = errors.length
      ? "ERROR"
      : skipped.length
        ? "SKIPPED"
        : warnings.length
          ? "WARNING"
          : options.dryRun
            ? "WOULD_CREATE"
            : eventCreated
              ? "CREATED"
              : "ERROR"
    const normalizedErrors = status === "ERROR" && !errors.length
      ? ["L'execució no ha creat ni omès l'event biogràfic"]
      : errors

    report.results.push({ reference: entry.reference, legacyIndex: entry.index, status, warnings, errors: normalizedErrors })
    report.created.push(...created)
    report.rolledBack.push(...rolledBack)
    report.skipped.push(...skipped)
    report.actions.push(...actions)
    if (warnings.length) report.warnings.push({ reference: entry.reference, reasons: warnings })
    if (normalizedErrors.length) report.errors.push({ reference: entry.reference, reasons: normalizedErrors })
  }

  const createdReferences = report.created
    .filter(item => item.type === "biography")
    .map(item => item.reference)
  report.summary = {
    TOTAL: entries.length,
    WOULD_CREATE: report.results.filter(item => item.status === "WOULD_CREATE").length,
    CREATED_EVENTS: createdReferences.length,
    SKIPPED: report.results.filter(item => item.status === "SKIPPED").length,
    SKIPPED_ARTWORKS: report.results.filter(item => item.status === "SKIPPED").length,
    WARNINGS: report.results.filter(item => item.status === "WARNING").length,
    ERRORS: report.results.filter(item => item.status === "ERROR").length,
    FILES_UPLOADED: report.created.filter(item => item.type === "file").length,
    FILES_REUSED: report.actions.filter(action => String(action.disposition || "").startsWith("REUSE")).length,
    FILES_ROLLED_BACK: report.rolledBack.filter(item => item.type === "file").length,
  }
  report.createdReferences = createdReferences
  report.skippedReferences = report.results.filter(item => item.status === "SKIPPED").map(item => item.reference)
  report.warningReferences = report.results.filter(item => item.status === "WARNING").map(item => ({ reference: item.reference, reasons: item.warnings }))
  report.errorReferences = report.results.filter(item => item.status === "ERROR").map(item => ({ reference: item.reference, reasons: item.errors }))
  return report
}

function runAllPages(options) {
  const allEntries = listPageEntries()
  const excluded = allEntries.filter(entry => EXCLUDED_PAGE_REFERENCES.has(entry.reference))
  const entries = allEntries.filter(entry => !EXCLUDED_PAGE_REFERENCES.has(entry.reference))
  const report = {
    mode: "dry-run",
    dryRun: true,
    type: "pages",
    all: true,
    excluded: excluded.map(entry => ({ reference: entry.reference, reason: "explicitly excluded" })),
    created: [],
    rolledBack: [],
    skipped: [],
    warnings: [],
    errors: [],
    actions: [],
    results: [],
  }

  const grouped = new Map()
  for (const entry of entries) {
    const group = grouped.get(entry.reference) || []
    group.push(entry.filename)
    grouped.set(entry.reference, group)
  }

  for (const [reference, filenames] of grouped) {
    if (filenames.length > 1) {
      const reason = "Reference legacy de page duplicada: " + reference
      report.errors.push({ reference, reasons: [reason], files: filenames })
      report.results.push({ reference, status: "ERROR", warnings: [], errors: [reason] })
      continue
    }

    const child = spawnSync(process.execPath, [
      fileURLToPath(import.meta.url), "--dry-run", "--type", "pages", "--reference", reference,
    ], {
      cwd: projectRoot,
      env: { ...process.env, MIGRATION_JSON_ONLY: "1" },
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    })

    let item
    try {
      item = JSON.parse(child.stdout)
    } catch {
      item = {
        skipped: [], warnings: [],
        errors: ["No s'ha pogut interpretar el dry-run de la page" + (child.stderr ? ": " + child.stderr.trim() : "")],
      }
    }
    const errors = item.errors || []
    const warnings = item.warnings || []
    const skipped = item.skipped || []
    const status = errors.length ? "ERROR" : skipped.length ? "SKIPPED" : warnings.length ? "WARNING" : "WOULD_CREATE"
    report.results.push({ reference, file: path.relative(projectRoot, filenames[0]).replaceAll("\\", "/"), status, warnings, errors })
    report.skipped.push(...skipped)
    if (warnings.length) report.warnings.push({ reference, reasons: warnings })
    if (errors.length) report.errors.push({ reference, file: path.relative(projectRoot, filenames[0]).replaceAll("\\", "/"), reasons: errors })
  }

  report.summary = {
    TOTAL: entries.length,
    EXCLUDED: excluded.length,
    WOULD_CREATE: report.results.filter(result => result.status === "WOULD_CREATE").length,
    SKIPPED_ARTWORKS: report.results.filter(result => result.status === "SKIPPED").length,
    WARNINGS: report.results.filter(result => result.status === "WARNING").length,
    ERRORS: report.results.filter(result => result.status === "ERROR").length,
  }
  report.skippedReferences = report.results.filter(result => result.status === "SKIPPED").map(result => result.reference)
  report.warningReferences = report.results.filter(result => result.status === "WARNING").map(result => ({ reference: result.reference, reasons: result.warnings }))
  report.errorReferences = report.results.filter(result => result.status === "ERROR").map(result => ({ reference: result.reference, reasons: result.errors }))
  return report
}
function runAllArtworks(options) {
  const entries = listArtworkEntries()
  const references = new Map()
  for (const entry of entries) {
    const group = references.get(entry.reference) || []
    group.push(entry.filename)
    references.set(entry.reference, group)
  }

  const report = {
    mode: options.dryRun ? "dry-run" : "write",
    dryRun: options.dryRun,
    type: "artwork",
    all: true,
    created: [],
    rolledBack: [],
    skipped: [],
    warnings: [],
    errors: [],
    actions: [],
    results: [],
  }

  for (const [reference, filenames] of references) {
    if (filenames.length > 1) {
      const reason = "Reference legacy duplicada: " + reference
      report.errors.push({ reference, reason, files: filenames.map(filename => path.relative(projectRoot, filename).replaceAll("\\", "/")) })
      report.results.push({ reference, status: "ERROR", warnings: [], errors: [reason] })
      continue
    }

    // Each artwork runs in an isolated process. Its uploadedFilesThisRun, cache and
    // rollback scope cannot contain uploads confirmed by a previous artwork.
    // The persistent SHA-256 file-map remains shared on disk between executions.
    const childArguments = [
      fileURLToPath(import.meta.url), "--type", "artwork", "--reference", reference,
    ]
    if (options.dryRun) childArguments.splice(1, 0, "--dry-run")
    const child = spawnSync(process.execPath, childArguments, {
      cwd: projectRoot,
      env: { ...process.env, MIGRATION_JSON_ONLY: "1" },
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    })

    let item
    try {
      item = JSON.parse(child.stdout)
    } catch {
      item = {
        created: [], rolledBack: [], skipped: [], warnings: [], actions: [],
        errors: ["No s'ha pogut interpretar el resultat de l'artwork" + (child.stderr ? ": " + child.stderr.trim() : "")],
      }
    }

    const created = item.created || []
    const rolledBack = item.rolledBack || []
    const errors = item.errors || []
    const warnings = item.warnings || []
    const skipped = item.skipped || []
    const actions = item.actions || []
    const artworkCreated = created.some(entry => entry.type === "artwork")
    const status = errors.length
      ? "ERROR"
      : skipped.length
        ? "SKIPPED"
        : warnings.length
          ? "WARNING"
          : options.dryRun
            ? "WOULD_CREATE"
            : artworkCreated
              ? "CREATED"
              : "ERROR"
    const normalizedErrors = status === "ERROR" && !errors.length
      ? ["L'execució no ha creat ni omès l'artwork"]
      : errors

    report.results.push({ reference, status, warnings, errors: normalizedErrors })
    report.created.push(...created)
    report.rolledBack.push(...rolledBack)
    report.skipped.push(...skipped)
    report.actions.push(...actions)
    if (warnings.length) report.warnings.push({ reference, reasons: warnings })
    if (normalizedErrors.length) report.errors.push({ reference, reasons: normalizedErrors })
  }

  const createdArtworkReferences = report.created
    .filter(entry => entry.type === "artwork")
    .map(entry => entry.reference)
  report.summary = {
    TOTAL: entries.length,
    WOULD_CREATE: report.results.filter(result => result.status === "WOULD_CREATE").length,
    CREATED_ARTWORKS: createdArtworkReferences.length,
    SKIPPED_ARTWORKS: report.results.filter(result => result.status === "SKIPPED").length,
    WARNINGS: report.results.filter(result => result.status === "WARNING").length,
    ERRORS: report.results.filter(result => result.status === "ERROR").length,
    FILES_UPLOADED: report.created.filter(entry => entry.type === "file").length,
    FILES_REUSED: report.actions.filter(action => String(action.disposition || "").startsWith("REUSE")).length,
    FILES_ROLLED_BACK: report.rolledBack.filter(entry => entry.type === "file").length,
  }
  report.createdReferences = createdArtworkReferences
  report.skippedReferences = report.results.filter(result => result.status === "SKIPPED").map(result => result.reference)
  report.warningReferences = report.results.filter(result => result.status === "WARNING").map(result => ({ reference: result.reference, reasons: result.warnings }))
  report.errorReferences = report.results.filter(result => result.status === "ERROR").map(result => ({ reference: result.reference, reasons: result.errors }))
  return report
}
async function run() {
  const options = parseArguments(process.argv.slice(2))
  requiredEnvironment()
  if (options.all) {
    if (options.type === "pages") return runAllPages(options)
    if (options.type === "biography") return runAllBiography(options)
    if (options.type === "press") return runAllPress(options)
    return runAllArtworks(options)
  }
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
    if (options.type === "pages") {
      return await runPage(options, report, fileMap, fileCache, uploadedFilesThisRun)
    }
    if (options.type === "biography") {
      return await runBiography(options, report, fileMap, fileCache, uploadedFilesThisRun)
    }
    if (options.type === "press") return await runPress(options, report)
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
    if (!serieLegacy) throw new Error("classification.serie és obligatori per resoldre primary_serie")
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
    if (!mainRelative) throw new Error("image.main és obligatori")
    const mainFilename = path.resolve(path.dirname(filename), mainRelative)
    if (!fs.existsSync(mainFilename)) throw new Error(`No existeix image.main: ${mainRelative}`)
    const mainImageId = await uploadFile(
      mainFilename, ARTWORKS_ASSET_FOLDER, fileCache, fileMap, uploadedFilesThisRun, report
    )
    let seoImageId
    if (data.seo?.image) {
      const seoFilename = path.resolve(path.dirname(filename), String(data.seo.image))
      if (!fs.existsSync(seoFilename)) throw new Error(`No existeix seo.image: ${data.seo.image}`)
      seoImageId = await uploadFile(
        seoFilename, ARTWORKS_ASSET_FOLDER, fileCache, fileMap, uploadedFilesThisRun, report
      )
    }

    const overriddenOtherImages = OTHER_IMAGE_OVERRIDES[effectiveReference]
    if (overriddenOtherImages) {
      report.actions.push({
        action: "apply_explicit_other_images_override",
        reference: effectiveReference,
        values: overriddenOtherImages,
      })
    }
    const legacyOtherImages = overriddenOtherImages || data.image?.otherImages
    if (legacyOtherImages !== undefined && !Array.isArray(legacyOtherImages)) {
      throw new Error("image.otherImages ha de ser un array")
    }
    const otherImageIds = []
    for (const [index, otherRelative] of (legacyOtherImages || []).entries()) {
      const otherFilename = path.resolve(path.dirname(filename), String(otherRelative))
      if (!fs.existsSync(otherFilename)) {
        throw new Error(`No existeix image.otherImages[${index}]: ${otherRelative}`)
      }
      otherImageIds.push(await uploadFile(
        otherFilename, ARTWORKS_ASSET_FOLDER, fileCache, fileMap, uploadedFilesThisRun, report
      ))
    }

    const payload = buildBasePayload(
      data,
      effectiveReference,
      resolved,
      mainImageId,
      seoImageId,
      otherImageIds,
      conversion.html
    )
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

if (process.env.MIGRATION_JSON_ONLY === "1") {
  console.log(JSON.stringify(report))
} else {
  console.log(JSON.stringify(report, null, 2))
  if (report.summary) {
    console.log((report.type === "pages" ? "TOTAL MIGRABLE: " : "TOTAL: ") + report.summary.TOTAL)
    if (report.type === "pages") console.log("EXCLUDED: " + report.summary.EXCLUDED)
    if (report.dryRun) console.log("WOULD_CREATE: " + report.summary.WOULD_CREATE)
    else {
      const createdLabel = report.type === "biography" ? "CREATED EVENTS: " : report.type === "press" ? "CREATED ARTICLES: " : "CREATED ARTWORKS: "
      console.log(createdLabel + (report.summary.CREATED_EVENTS ?? report.summary.CREATED_ARTICLES ?? report.summary.CREATED_ARTWORKS))
    }
    console.log((report.type === "artwork" ? "SKIPPED ARTWORKS: " : "SKIPPED: ") + (report.summary.SKIPPED ?? report.summary.SKIPPED_ARTWORKS))
    console.log("WARNINGS: " + report.summary.WARNINGS)
    console.log("ERRORS: " + report.summary.ERRORS)
    if (!report.dryRun) {
      console.log("FILES UPLOADED: " + report.summary.FILES_UPLOADED)
      console.log("FILES REUSED: " + report.summary.FILES_REUSED)
      console.log("FILES ROLLED BACK: " + report.summary.FILES_ROLLED_BACK)
    }
  } else {
    console.log("CREATED: " + report.created.length)
    console.log("SKIPPED: " + report.skipped.length)
    console.log("WARNING: " + report.warnings.length)
    console.log("ERROR: " + report.errors.length)
  }
}
if (report.errors.length) process.exitCode = 1