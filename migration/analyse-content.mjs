#!/usr/bin/env node

/**
 * Read-only migration analyser.
 *
 * Reads migration/directus-schema.json and the repository's source content.
 * It never contacts Directus and only writes the three documented reports in
 * migration/.
 */

import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import yaml from "js-yaml"

const root = path.resolve(import.meta.dirname, "..")
const migrationDir = path.join(root, "migration")
const schemaPath = path.join(migrationDir, "directus-schema.json")
const contentDir = path.join(root, "content")
const reportPaths = {
  json: path.join(migrationDir, "migration-analysis.json"),
  analysis: path.join(migrationDir, "migration-analysis.md"),
  mapping: path.join(migrationDir, "proposed-mapping.md"),
}
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".tif", ".tiff"])
const relative = value => path.relative(root, value).split(path.sep).join("/")
const sortStrings = values => [...values].sort((a, b) => a.localeCompare(b, "ca"))
const asArray = value => Array.isArray(value) ? value : value == null ? [] : [value]
const unique = values => [...new Set(values)]
const isPlainObject = value => value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)
const jsonValue = value => value instanceof Date ? value.toISOString() : value

function walk(directory, predicate = () => true) {
  if (!fs.existsSync(directory)) return []
  const result = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...walk(fullPath, predicate))
    else if (predicate(fullPath)) result.push(fullPath)
  }
  return result
}

function valueType(value) {
  if (value === null) return "null"
  if (value instanceof Date) return "date"
  if (Array.isArray(value)) return "array"
  if (isPlainObject(value)) return "object"
  return typeof value
}

function valueFormat(value) {
  if (value instanceof Date) return "parsed-date"
  if (typeof value !== "string") return valueType(value)
  if (value === "") return "empty-string"
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date-YYYY-MM-DD"
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) return "date-non-padded"
  if (/^https?:\/\//i.test(value)) return "absolute-url"
  if (/<[a-z][\s\S]*>/i.test(value)) return "html"
  if (imageExtensions.has(path.extname(value).toLowerCase())) return "image-path"
  return "string"
}

function preview(value) {
  const normalized = JSON.stringify(value, (_key, item) => jsonValue(item)) ?? String(value)
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized
}

function classifyDocument(filePath) {
  const file = relative(filePath)
  if (/^content\/paints\/.+\/paint\.mdx?$/i.test(file)) return "artworks"
  if (/^content\/series\/.+\/serie\.mdx?$/i.test(file)) return "series"
  if (/^content\/pageTexts\//i.test(file)) return "pages"
  if (/^content\/blog\//i.test(file)) return "blog_unmapped"
  return "unclassified"
}

function flattenFrontmatter(value, documentPath, output, prefix = "") {
  if (prefix) {
    if (!output[prefix]) output[prefix] = { appearances: 0, documents: [], types: {}, formats: {}, examples: [] }
    const entry = output[prefix]
    entry.appearances += 1
    entry.documents.push(documentPath)
    const type = valueType(value)
    const format = valueFormat(value)
    entry.types[type] = (entry.types[type] || 0) + 1
    entry.formats[format] = (entry.formats[format] || 0) + 1
    const example = preview(value)
    if (!entry.examples.includes(example) && entry.examples.length < 5) entry.examples.push(example)
  }
  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      flattenFrontmatter(child, documentPath, output, prefix ? `${prefix}.${key}` : key)
    }
  } else if (Array.isArray(value)) {
    for (const child of value) {
      if (isPlainObject(child)) flattenFrontmatter(child, documentPath, output, `${prefix}[]`)
    }
  }
}

function parseDocuments() {
  const files = walk(contentDir, file => [".md", ".mdx"].includes(path.extname(file).toLowerCase()))
  const documents = []
  const parseErrors = []
  const fieldStats = {}
  for (const filePath of files) {
    const file = relative(filePath)
    const raw = fs.readFileSync(filePath, "utf8")
    try {
      const parsed = matter(raw, { engines: { yaml: source => yaml.load(source) || {} } })
      const frontmatter = parsed.data || {}
      flattenFrontmatter(frontmatter, file, fieldStats)
      documents.push({
        path: file,
        absolutePath: filePath,
        directory: relative(path.dirname(filePath)),
        extension: path.extname(filePath).toLowerCase(),
        detectedType: classifyDocument(filePath),
        frontmatter,
        body: parsed.content,
        bodyLength: parsed.content.length,
        hasBody: parsed.content.trim().length > 0,
      })
    } catch (error) {
      parseErrors.push({ path: file, error: error.message })
    }
  }
  for (const stat of Object.values(fieldStats)) {
    stat.documents = sortStrings(unique(stat.documents))
    stat.exceptions = []
    if (Object.keys(stat.types).length > 1) stat.exceptions.push("multiple-value-types")
    if (stat.formats["empty-string"]) stat.exceptions.push("contains-empty-string")
    if (stat.formats["date-non-padded"]) stat.exceptions.push("contains-non-padded-date")
  }
  return { documents, parseErrors, fieldStats }
}

function extractImageReferences(document) {
  const references = []
  function visit(value, field) {
    if (typeof value === "string" && imageExtensions.has(path.extname(value.split(/[?#]/)[0]).toLowerCase())) {
      references.push({ source: "frontmatter", field, value })
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${field}[${index}]`))
    } else if (isPlainObject(value)) {
      Object.entries(value).forEach(([key, item]) => visit(item, field ? `${field}.${key}` : key))
    }
  }
  visit(document.frontmatter, "")
  const markdownImage = /!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g
  const htmlImage = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi
  for (const expression of [markdownImage, htmlImage]) {
    let match
    while ((match = expression.exec(document.body))) references.push({ source: "body", field: "body", value: match[1] })
  }
  return references
}

function resolveImage(document, referenceValue) {
  const clean = referenceValue.split(/[?#]/)[0]
  if (/^(https?:)?\/\//i.test(clean) || /^data:/i.test(clean)) return { kind: "remote", resolved: null }
  const candidates = clean.startsWith("/")
    ? [path.join(root, "static", clean.replace(/^\/+/, "")), path.join(root, clean.replace(/^\/+/, ""))]
    : [path.resolve(path.dirname(document.absolutePath), clean), path.resolve(contentDir, clean), path.resolve(root, "static", clean)]
  const found = candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
  return { kind: "local", resolved: found ? relative(found) : null, candidates: candidates.map(relative) }
}

function analyseImages(documents) {
  const sourceRoots = [contentDir, path.join(root, "static"), path.join(root, "src")]
  const existing = sortStrings(unique(
    sourceRoots.flatMap(directory => walk(directory, file => imageExtensions.has(path.extname(file).toLowerCase())))
      .map(relative)
  ))
  const uses = []
  for (const document of documents) {
    for (const reference of extractImageReferences(document)) {
      const resolution = resolveImage(document, reference.value)
      uses.push({ document: document.path, ...reference, ...resolution })
    }
  }
  const resolvedUses = uses.filter(item => item.resolved)
  const unresolved = uses.filter(item => item.kind === "local" && !item.resolved)
  const remote = uses.filter(item => item.kind === "remote")
  const usageMap = Object.fromEntries(existing.map(file => [file, []]))
  for (const use of resolvedUses) usageMap[use.resolved] ||= [], usageMap[use.resolved].push({ document: use.document, field: use.field, value: use.value })
  const unused = existing.filter(file => !usageMap[file]?.length)
  const reusedAcrossDocuments = Object.entries(usageMap)
    .map(([file, entries]) => ({ file, documents: unique(entries.map(item => item.document)), uses: entries }))
    .filter(item => item.documents.length > 1)
  return { existing, total: existing.length, references: uses, resolvedCount: resolvedUses.length, unresolved, remote, unused, reusedAcrossDocuments, usageMap }
}

function analyseSchema() {
  const raw = JSON.parse(fs.readFileSync(schemaPath, "utf8"))
  const schema = raw.data || raw
  const fieldsByCollection = Object.groupBy(schema.fields, field => field.collection)
  const relations = schema.relations.map(relation => {
    const meta = relation.meta || {}
    const sourceField = fieldsByCollection[relation.collection]?.find(field => field.field === relation.field)
    const special = asArray(sourceField?.meta?.special)
    const isTranslationRelation = meta.one_field === "translations" || special.includes("translations")
    const kind = isTranslationRelation ? "translation" : (special.includes("m2m") || meta.junction_field ? "M2M" : "M2O")
    return {
      collection: relation.collection,
      field: relation.field,
      relatedCollection: relation.related_collection,
      kind,
      manyCollection: meta.many_collection,
      manyField: meta.many_field,
      oneCollection: meta.one_collection,
      oneField: meta.one_field,
      junctionField: meta.junction_field,
      sortField: meta.sort_field,
      onDelete: relation.schema?.on_delete,
    }
  })
  const junctionCollections = sortStrings(unique(relations.filter(item => item.junctionField).map(item => item.manyCollection).filter(Boolean)))
  const collections = schema.collections.map(collection => {
    const fields = fieldsByCollection[collection.collection] || []
    return {
      name: collection.collection,
      primaryKeys: fields.filter(field => field.schema?.is_primary_key).map(field => field.field),
      uniqueFields: fields.filter(field => field.schema?.is_unique).map(field => field.field),
      requiredFields: fields.filter(field => field.meta?.required).map(field => field.field),
      translationCollection: collection.collection.endsWith("_translations"),
      junctionCollection: junctionCollections.includes(collection.collection),
      fields: fields.map(field => ({
        name: field.field,
        type: field.type,
        required: Boolean(field.meta?.required),
        primaryKey: Boolean(field.schema?.is_primary_key),
        unique: Boolean(field.schema?.is_unique),
        nullable: field.schema?.is_nullable,
        defaultValue: field.schema?.default_value ?? null,
        special: asArray(field.meta?.special),
        interface: field.meta?.interface || null,
        hidden: Boolean(field.meta?.hidden),
        readonly: Boolean(field.meta?.readonly),
        foreignKeyTable: field.schema?.foreign_key_table || null,
        foreignKeyColumn: field.schema?.foreign_key_column || null,
      })),
    }
  })
  const fileFields = collections.flatMap(collection => collection.fields
    .filter(field => field.special.some(item => ["file", "files"].includes(item)) || field.foreignKeyTable === "directus_files")
    .map(field => ({ collection: collection.name, field: field.name, multiple: field.special.includes("files") })))
  return {
    metadata: { version: schema.version, directus: schema.directus, vendor: schema.vendor },
    counts: { collections: collections.length, fields: schema.fields.length, relations: relations.length },
    collections,
    translationCollections: collections.filter(item => item.translationCollection).map(item => item.name),
    junctionCollections,
    fileFields,
    relations,
    m2o: relations.filter(item => item.kind === "M2O"),
    m2m: relations.filter(item => item.kind === "M2M"),
  }
}

function vocabulary(documents, selector) {
  const entries = []
  for (const document of documents) {
    for (const value of asArray(selector(document.frontmatter)).flat(Infinity)) {
      if (value !== undefined && value !== null && String(value).trim()) entries.push({ value: String(value), document: document.path })
    }
  }
  const grouped = new Map()
  for (const entry of entries) {
    if (!grouped.has(entry.value)) grouped.set(entry.value, [])
    grouped.get(entry.value).push(entry.document)
  }
  return [...grouped].map(([value, files]) => ({ value, count: files.length, documents: sortStrings(unique(files)) }))
    .sort((a, b) => a.value.localeCompare(b.value, "ca"))
}

function analyseContent(documents) {
  const byType = Object.fromEntries(Object.entries(Object.groupBy(documents, document => document.detectedType))
    .map(([type, docs]) => [type, docs.length]))
  const references = new Map()
  for (const document of documents) {
    const reference = document.frontmatter.reference
    if (!reference) continue
    if (!references.has(reference)) references.set(reference, [])
    references.get(reference).push(document.path)
  }
  const duplicateReferences = [...references]
    .filter(([_reference, files]) => files.length > 1)
    .map(([reference, files]) => ({ reference, documents: sortStrings(files) }))
  const slugMismatches = documents.filter(document => {
    const reference = document.frontmatter.reference
    if (!reference) return false
    const folder = path.posix.basename(document.directory)
    return folder.toLowerCase() !== String(reference).toLowerCase()
  }).map(document => ({ document: document.path, folder: path.posix.basename(document.directory), reference: document.frontmatter.reference, pageName: document.frontmatter.pageName, url: document.frontmatter.url }))
  const pageDocuments = documents.filter(document => document.detectedType === "pages")
  const multiPanelSizes = documents.filter(document => asArray(document.frontmatter.sizes).length > 1)
    .map(document => ({ document: document.path, panels: document.frontmatter.sizes.length }))
  const pageCandidates = pageDocuments.map(document => ({
    document: document.path,
    reference: document.frontmatter.reference || path.posix.basename(document.directory),
    paragraphCount: asArray(document.frontmatter.paragraphs).length,
    hasBody: document.hasBody,
  }))
  const about = pageDocuments.find(document => document.frontmatter.reference === "about")
  const press = pageDocuments.find(document => document.frontmatter.reference === "press")
  const exhibitionPage = pageDocuments.find(document => document.frontmatter.reference === "exhibitions")
  return {
    totalDocuments: documents.length,
    byType,
    documents: documents.map(document => ({ path: document.path, detectedType: document.detectedType, reference: document.frontmatter.reference || null, hasBody: document.hasBody, bodyLength: document.bodyLength })),
    duplicateReferences,
    slugMismatches,
    multiPanelSizes,
    pageCandidates,
    extractedCandidates: {
      biography_events: { count: asArray(about?.frontmatter.paragraphs).length, source: about?.path || null, confidence: "probable" },
      press_articles: { count: asArray(press?.frontmatter.paragraphs).length, source: press?.path || null, confidence: "high" },
      exhibitions: { count: 0, source: exhibitionPage?.path || null, confidence: "excluded", note: "Explicitly excluded from migration. Placeholder content must not be imported; future exhibition data will be authored directly in Directus." },
      tags: { count: vocabulary(documents, data => data.classification?.tags || data.tags).length, confidence: "probable" },
    },
    vocabularies: {
      series: vocabulary(documents, data => data.classification?.serie || data.serie),
      tags: vocabulary(documents, data => data.classification?.tags || data.tags),
      seoKeywords: vocabulary(documents, data => data.seo?.keywords),
      categories: vocabulary(documents, data => data.classification?.category),
      techniques: vocabulary(documents, data => data.classification?.technique),
      styles: vocabulary(documents, data => data.classification?.style),
      compositions: vocabulary(documents, data => data.classification?.composition),
      surfaces: vocabulary(documents, data => data.classification?.surface),
      saleStatuses: vocabulary(documents, data => data.sellingData?.productState),
    },
  }
}

const mappings = [
  { type: "artworks", source: "reference", destination: "artworks.reference", confidence: "safe", transformation: "none" },
  { type: "artworks", source: "order", destination: "artworks.sort", confidence: "safe", transformation: "numeric copy" },
  { type: "artworks", source: "date", destination: "artworks.date", confidence: "safe", transformation: "normalize to 12:00 Europe/Madrid, respecting CET/CEST for the date; never use a fixed UTC offset" },
  { type: "artworks", source: "showOnMainScreen", destination: "artworks.show_on_home", confidence: "safe", transformation: "rename" },
  { type: "artworks", source: "hide", destination: "artworks.status", confidence: "safe", transformation: "true → archived; false or absent → published" },
  { type: "artworks", source: "title/subtitle/description + MDX body", destination: "artworks_translations.title/subtitle/description/body", confidence: "safe", transformation: "create only languages_code=ca; convert Markdown/compatible MDX body to HTML, preserve existing HTML, and report unconvertible JSX/MDX without silently dropping it" },
  { type: "artworks", source: "seo.description/seo.keywords/seo.image", destination: "artworks_translations.seo_description/seo_keywords + artworks.seo_image", confidence: "safe", transformation: "upload and resolve file IDs" },
  { type: "artworks", source: "image.main/image.otherImages", destination: "artworks.main_image/artworks.other_images via artworks_files", confidence: "safe", transformation: "upload files first; preserve ordering" },
  { type: "artworks", source: "sizes[].cm.height/width + array index", destination: "artwork_dimensions.height_cm/width_cm/sort linked by artworks_id", confidence: "safe", transformation: "create one ordered artwork_dimensions row per sizes[] element; preserve all panels" },
  { type: "artworks", source: "sizes[].cm.depth or sizes[].cm.breadth", destination: "artwork_dimensions.depth_cm", confidence: "safe", transformation: "prefer cm.depth; otherwise use legacy cm.breadth as the third dimension/depth; if neither exists omit depth_cm so Directus applies its schema default" },

  { type: "artworks", source: "none", destination: "legacy scalar artworks.height_cm/width_cm/depth_cm", confidence: "excluded", transformation: "ignore during migration; fields are temporary preservation fields and will be removed manually after transfer" },
  { type: "artworks", source: "classification.serie", destination: "artworks.primary_serie", confidence: "safe", transformation: "resolve case-insensitively against series reference/title; leave alternative_series empty because the legacy model contains one series only" },
  { type: "artworks", source: "classification.technique/style/composition/surface", destination: "technique/styles/composition/surface relations and vocabulary collections", confidence: "safe", transformation: "use the explicit table in vocabulary-map-proposal.md; split confirmed compounds; Undefined means no style; never fuzzy-match" },
  { type: "artworks", source: "classification.tags/tags", destination: "artworks.tags via artworks_tags and tags(_translations)", confidence: "safe", transformation: "no non-empty legacy tags exist, so create no tags or tag relations" },
  { type: "artworks", source: "sellingData.productState/showProductState/priceEur/showPrice", destination: "sale_status/show_sale_status/price_eur/show_price", confidence: "safe", transformation: "copy explicit legacy values; omit any absent field so Directus applies its schema default" },
  { type: "artworks", source: "quote.text", destination: "artworks_translations.quote_text", confidence: "safe", transformation: "create only languages_code=ca" },
  { type: "artworks", source: "quote.author", destination: "artworks.quote_author and artworks_translations.quote_author", confidence: "safe", transformation: "copy the legacy author to both schema fields; create only the ca translation row" },
  { type: "series", source: "reference/order/date", destination: "series.reference/sort/date", confidence: "safe", transformation: "copy reference/sort; normalize dateTime values to 12:00 Europe/Madrid, respecting CET/CEST" },
  { type: "series", source: "title/subtitle/description + body", destination: "series_translations.title/subtitle/description/body", confidence: "safe", transformation: "create only languages_code=ca; convert Markdown/compatible MDX body to HTML, preserve existing HTML, and report unconvertible JSX/MDX" },
  { type: "series", source: "image.main + seo.image", destination: "series.main_image/seo_image", confidence: "safe", transformation: "upload files first" },
  { type: "series", source: "hide", destination: "series.status", confidence: "safe", transformation: "true → archived; false or absent → published" },
  { type: "series", source: "quote.* / seo.*", destination: "series(_translations) quote and SEO fields", confidence: "probable", transformation: "choose duplicate author field policy" },
  { type: "pages", source: "reference", destination: "pages.reference", confidence: "safe", transformation: "none" },
  { type: "pages", source: "hide", destination: "pages.status", confidence: "safe", transformation: "true → archived; false or absent → published" },
  { type: "pages", source: "body", destination: "pages_translations.body", confidence: "safe", transformation: "create only languages_code=ca; convert Markdown/compatible MDX to HTML, preserve existing HTML, and report unconvertible JSX/MDX" },
  { type: "pages", source: "seo.*", destination: "pages_translations.seo_* + pages.seo_image", confidence: "safe", transformation: "upload file first" },
  { type: "pages", source: "title/subtitle", destination: "pages_translations.title/subtitle", confidence: "probable", transformation: "some page documents have no title; manual/default title needed" },
  { type: "biography_events", source: "about.paragraphs[].title", destination: "biography_events_translations.year_label", confidence: "safe", transformation: "preserve the exact visible legacy value" },
  { type: "biography_events", source: "about.paragraphs[].subtitle/text", destination: "biography_events_translations.title/description", confidence: "safe", transformation: "copy subtitle to title when present and text to description; title may be empty and must not be invented (schema still marks title required)" },
  { type: "biography_events", source: "most precise available legacy date or year_label", destination: "biography_events.reference_date", confidence: "safe", transformation: "use the precise date when available; otherwise YYYY becomes synthetic YYYY-01-01 12:00 Europe/Madrid for ordering only and must not be presented as historically known" },
  { type: "biography_events", source: "reference_date", destination: "biography_events.reference", confidence: "safe", transformation: "generate deterministic YYYYMMDD with -02, -03, ... collisions in stable source order" },
  { type: "biography_events", source: "about.paragraphs[].image", destination: "biography_events.image/images", confidence: "probable", transformation: "ignore empty strings; upload files" },
  { type: "press_articles", source: "press.paragraphs[].date", destination: "press_articles.reference_date", confidence: "safe", transformation: "zero-pad legacy dates and normalize dateTime to 12:00 Europe/Madrid, respecting CET/CEST" },
  { type: "press_articles", source: "press.paragraphs[].title/text", destination: "press_articles_translations.title/description", confidence: "safe", transformation: "create only languages_code=ca and preserve source text verbatim" },
  { type: "press_articles", source: "press.paragraphs[].author/link", destination: "press_articles.author/external_url", confidence: "safe", transformation: "rename link" },
  { type: "press_articles", source: "complete reference_date", destination: "press_articles.reference", confidence: "safe", transformation: "generate deterministic YYYYMMDD; append -02, -03, ... for same-collection collisions in stable source order" },
  { type: "press_articles", source: "no explicit source", destination: "press_articles.media", confidence: "manual", transformation: "required field has no approved legacy mapping; do not infer it from author or domain" },
  { type: "exhibitions", source: "content/pageTexts/exhibitions/** and exhibition-like prose", destination: "none during migration", confidence: "excluded", transformation: "do not import placeholder data; future exhibition content will be authored directly in Directus" },
  { type: "blog", source: "content/blog/**", destination: "none", confidence: "excluded", transformation: "exclude completely; do not create a collection or import any blog data" },
]

function destinationFieldSet() {
  const result = new Set()
  for (const mapping of mappings) {
    for (const token of mapping.destination.matchAll(/\b([a-z][a-z0-9_]+)\.([a-z][a-z0-9_]*)\b/gi)) result.add(`${token[1]}.${token[2]}`)
  }
  result.add("artworks.sale_status")
  result.add("artwork_dimensions.height_cm")
  result.add("artwork_dimensions.width_cm")
  result.add("artworks.dimensions")
  for (const field of [
    "artwork_composition.reference", "artwork_composition_translations.name",
    "artwork_styles.reference", "artwork_styles_translations.name",
    "artwork_surfaces.reference", "artwork_surfaces_translations.name",
    "artwork_tecniques.reference", "artwork_tecniques_translations.name",
  ]) result.add(field)
  return result
}

function mandatoryWithoutOrigin(schemaAnalysis) {
  const covered = destinationFieldSet()
  const relevant = new Set(["artwork_dimensions", "artwork_composition", "artwork_composition_translations", "artwork_styles", "artwork_styles_translations", "artwork_surfaces", "artwork_surfaces_translations", "artwork_tecniques", "artwork_tecniques_translations", "artworks", "artworks_translations", "series", "series_translations", "tags", "tags_translations", "pages", "pages_translations", "biography_events", "biography_events_translations", "press_articles", "press_articles_translations", "press_tags", "press_tags_translations"])
  return schemaAnalysis.collections.flatMap(collection => {
    if (!relevant.has(collection.name)) return []
    return collection.fields.filter(field => field.required && !covered.has(`${collection.name}.${field.name}`))
      .map(field => ({ collection: collection.name, field: field.name, note: ["status"].includes(field.name) ? "No legacy origin; omit from payload so the Directus schema default applies" : ["languages_code"].includes(field.name) ? "Use ca only" : "No direct Gatsby source identified" }))
  })
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ")
}

function schemaMarkdown(schema) {
  return schema.collections.map(collection => {
    const fieldRows = collection.fields.map(field => `| ${mdEscape(field.name)} | ${field.type} | ${field.primaryKey ? "yes" : ""} | ${field.unique ? "yes" : ""} | ${field.required ? "yes" : ""} | ${mdEscape(field.special.join(", "))} | ${mdEscape(field.foreignKeyTable || "")} |`).join("\n")
    return `### ${collection.name}\n\n- Translation collection: ${collection.translationCollection ? "yes" : "no"}\n- Junction collection: ${collection.junctionCollection ? "yes" : "no"}\n- Primary key(s): ${collection.primaryKeys.join(", ") || "none detected"}\n- Unique field(s): ${collection.uniqueFields.join(", ") || "none"}\n- Required field(s): ${collection.requiredFields.join(", ") || "none"}\n\n| Field | Type | PK | Unique | Required | Special | FK table |\n|---|---|---:|---:|---:|---|---|\n${fieldRows}`
  }).join("\n\n")
}

function createAnalysisMarkdown(analysis) {
  const { schema, content, frontmatter, images, inconsistencies, requiredWithoutOrigin } = analysis
  const typeRows = Object.entries(content.byType).map(([type, count]) => `| ${type} | ${count} |`).join("\n")
  const fieldRows = Object.entries(frontmatter.fields).map(([field, stat]) => `| ${mdEscape(field)} | ${stat.appearances} | ${mdEscape(Object.entries(stat.types).map(([type, count]) => `${type}:${count}`).join(", "))} | ${mdEscape(Object.keys(stat.formats).join(", "))} | ${mdEscape(stat.examples.slice(0, 2).join("; "))} | ${mdEscape(stat.exceptions.join(", "))} |`).join("\n")
  const unresolvedRows = images.unresolved.map(item => `| ${item.document} | ${mdEscape(item.field)} | ${mdEscape(item.value)} |`).join("\n") || "| — | — | — |"
  const unusedRows = images.unused.map(file => `- ${file}`).join("\n") || "- None"
  const vocabularySections = Object.entries(content.vocabularies).map(([name, entries]) => `### ${name}\n\n${entries.length ? entries.map(entry => `- \`${entry.value}\` — ${entry.count} document(s)`).join("\n") : "- No values found"}`).join("\n\n")
  return `# Gatsby content migration analysis\n\nGenerated by \`node migration/analyse-content.mjs\`. This report is local-only and made no HTTP requests.\n\n## Summary\n\n- MD/MDX documents: **${content.totalDocuments}**\n- Parse errors: **${frontmatter.parseErrors.length}**\n- Source images: **${images.total}**\n- Image references: **${images.references.length}**\n- Unresolved local image references: **${images.unresolved.length}**\n- Unused source images: **${images.unused.length}**\n- Duplicate references: **${content.duplicateReferences.length}**\n- Directus collections: **${schema.counts.collections}**\n- Directus fields: **${schema.counts.fields}**\n- Directus relations: **${schema.counts.relations}**\n\n## Documents by detected type\n\n| Type | Count |\n|---|---:|\n${typeRows}\n\n## Extracted nested candidates\n\n- Biography events from \`about.paragraphs\`: **${content.extractedCandidates.biography_events.count}** (${content.extractedCandidates.biography_events.confidence})\n- Press articles from \`press.paragraphs\`: **${content.extractedCandidates.press_articles.count}** (${content.extractedCandidates.press_articles.confidence})\n- Exhibitions: **${content.extractedCandidates.exhibitions.count}** safely detected. ${content.extractedCandidates.exhibitions.note}\n\n## Frontmatter field inventory\n\n| Field | Appearances | Types | Formats | Examples | Exceptions |\n|---|---:|---|---|---|---|\n${fieldRows}\n\nThe JSON report includes the complete document list for every field.\n\n## Vocabularies\n\n${vocabularySections}\n\n## Images\n\n### Locations\n\nImages were inventoried under \`content/\`, \`static/\`, and \`src/\`. Generated folders such as \`public/\` and \`generated-assets/\` are deliberately excluded.\n\n### Unresolved references\n\n| Document | Field | Reference |\n|---|---|---|\n${unresolvedRows}\n\n### Images apparently unused by MD/MDX\n\n${unusedRows}\n\n### Reused by more than one document\n\n${images.reusedAcrossDocuments.length ? images.reusedAcrossDocuments.map(item => `- ${item.file}: ${item.documents.join(", ")}`).join("\n") : "- None"}\n\n## Main inconsistencies\n\n${inconsistencies.length ? inconsistencies.map(item => `- **${item.kind}**: ${mdEscape(item.summary)}`).join("\n") : "- None detected"}\n\n## Required Directus fields without an apparent origin\n\n${requiredWithoutOrigin.length ? requiredWithoutOrigin.map(item => `- \`${item.collection}.${item.field}\`: ${item.note}`).join("\n") : "- None"}\n\n## Complete Directus schema inventory\n\nSource of truth: \`migration/directus-schema.json\`.\n\n### Translation collections\n\n${schema.translationCollections.map(name => `- ${name}`).join("\n")}\n\n### Junction collections\n\n${schema.junctionCollections.map(name => `- ${name}`).join("\n")}\n\n### File fields\n\n${schema.fileFields.map(item => `- \`${item.collection}.${item.field}\` (${item.multiple ? "multiple" : "single"})`).join("\n")}\n\n${schemaMarkdown(schema)}\n`
}

function createMappingMarkdown(analysis) {
  const rows = mappings.map(item => `| ${item.type} | ${mdEscape(item.source)} | ${mdEscape(item.destination)} | ${item.confidence} | ${mdEscape(item.transformation)} |`).join("\n")
  const safe = mappings.filter(item => item.confidence === "safe")
  const manual = mappings.filter(item => item.confidence === "manual")
  const excluded = mappings.filter(item => item.confidence === "excluded")
  return `# Proposed Gatsby → Directus mapping

This proposal is based on the real source content and \`migration/directus-schema.json\`. It does not implement or execute an import.

## Translation policy

Import the existing Catalan source values into \`*_translations\` using \`languages_code=ca\`. Do **not** generate or import Spanish or English translations in this phase. Quotations and individual foreign-language titles must remain verbatim; no text should be machine-translated.

## Import-wide rules

### Existing records: append-only

- Before creating anything associated with a source record, look up the destination record by exact \`reference\`.
- If that reference already exists, **SKIP the entire record**.
- Never update or overwrite an existing record.
- Apply the skip before translations, relations, dimensions or associated files are created.

### Defaults

- When a Directus field has no legacy origin, omit it from the payload so the schema default applies.
- Never invent a value merely to populate an optional or defaulted field.
- If there is no default and the field is nullable, it may remain null.

### Dates and dateTimes

- Normalize every imported Directus \`dateTime\` value to 12:00 noon in \`Europe/Madrid\`.
- For PostgreSQL \`timestamp without time zone\`, send the literal local value \`YYYY-MM-DDT12:00:00\` without an offset. Respect CET/CEST only for conversions that actually require timezone information.
- Directus \`date\` fields without time remain \`YYYY-MM-DD\`.

### Generated references

- When a record lacks a legacy reference and has a complete \`reference_date\`, generate \`YYYYMMDD\`.
- Resolve collisions deterministically within the same collection as \`YYYYMMDD\`, \`YYYYMMDD-02\`, \`YYYYMMDD-03\`, and so on, using stable source order.
- A partial date that lacks a reliable month or day is insufficient. Report it for manual decision and do not invent date components.
- Biography events are the explicit exception for year-only legacy values: use synthetic \`YYYY-01-01 12:00 Europe/Madrid\` solely for ordering, preserve the original visible value in \`year_label\`, and never present the synthetic date as historically known.

### Rich-text HTML

- Do not store legacy bodies as raw MDX.
- Convert Markdown and compatible MDX syntax to HTML before writing a Directus rich-text HTML field.
- Preserve HTML already present in the body.
- Detect and report JSX/MDX components that cannot be converted automatically; never silently remove their content.

## Detailed mapping

| Content type | Gatsby source | Directus destination | Confidence | Transformation / decision |
|---|---|---|---|---|
${rows}

## Safe mappings

${safe.map(item => `- ${item.source} → ${item.destination}`).join("\n")}

## Manual decisions required

${manual.map(item => `- **${item.type}: ${item.source} → ${item.destination}** — ${item.transformation}`).join("\n") || "- None"}

## Explicitly excluded

${excluded.map(item => `- **${item.type}: ${item.source}** — ${item.transformation}`).join("\n")}

## Relations to resolve during a future importer

- Apply the append-only reference check before uploading files or creating translations, dimensions and relations.
- For new records only, upload source images and retain a deterministic source-path → Directus file ID map.
- Resolve the one legacy \`classification.serie\` as \`artworks.primary_serie\`; leave \`artworks.alternative_series\` empty.
- Preserve ordering in \`artwork_dimensions\`, \`artworks_files\` and other ordered relation collections.
- Use the exact mapping in \`vocabulary-map-proposal.md\`. Before creating a vocabulary item, look up its exact reference; if it exists, do not create or update it and reuse its ID for the artwork relation. Never fuzzy-match.
- Verified existing references to reuse: techniques \`acrylic\`, \`watercolor\`; styles \`scratch\`, \`figurative\`; surface \`paper\`; compositions \`single\`, \`triptych\`. Missing references to create for migrated content: styles \`abstract\`, \`textures\`; surface \`wood\`.
- Never infer SEO keywords as public tags.
- Do not create exhibition records from Gatsby prose or placeholders.

## Dimensions

- \`sizes[]\` is the Gatsby origin for \`artworks.dimensions\` and \`artwork_dimensions\`.
- Create one \`artwork_dimensions\` row for every \`sizes[]\` element and preserve array order in \`sort\`.
- Map \`cm.height → height_cm\` and \`cm.width → width_cm\`.
- For \`depth_cm\`, prefer \`cm.depth\`; otherwise use legacy \`cm.breadth\`, which is confirmed as the third dimension/depth.
- If neither depth source exists, omit \`depth_cm\` so Directus applies its schema default.
- Exclude temporary scalar \`artworks.height_cm\`, \`artworks.width_cm\` and \`artworks.depth_cm\`. Remove them manually from the schema only after transferred dimensions have been validated.

## Potential information loss

- Multiple panels are preserved as multiple ordered \`artwork_dimensions\` rows.
- Unconvertible JSX/MDX is an incident requiring review, never content to discard silently.
- Legacy \`pageName\` and \`url\` have no necessary destination when \`reference\` is canonical, but mismatches must be reviewed before dropping them.
- Legacy fields beginning with an underscore (for example \`_subtitle\`) have no explicit Directus destination.
- Blog and exhibition placeholder content are intentionally excluded.
- Page \`paragraphs\` structures do not belong to \`pages_translations\`; only the about and press lists have probable dedicated destinations.

## New Directus capabilities absent from Gatsby

- Alternative series and richer exhibition ↔ artwork/series relations.
- Multiple files for biography events, exhibitions and press articles.
- Press tags and explicit press/exhibition relationships.
- Separate image alt text and wall-label fields.
- Workflow status, audit fields, sale visibility and sold-to information.
- Structured exhibition venue, city, type and start/end dates.
- Multiple ordered dimension rows through \`artwork_dimensions\`.

## Required fields with no apparent source or unresolved policy

${analysis.requiredWithoutOrigin.map(item => `- \`${item.collection}.${item.field}\`: ${item.note}`).join("\n") || "- None"}
`
}
function buildInconsistencies(content, parsed, images) {
  const result = []
  if (parsed.parseErrors.length) result.push({ kind: "parse-errors", summary: `${parsed.parseErrors.length} documents could not be parsed` })
  if (content.duplicateReferences.length) result.push({ kind: "duplicate-references", summary: `${content.duplicateReferences.length} references occur in multiple documents` })
  if (content.slugMismatches.length) result.push({ kind: "slug-reference-mismatches", summary: `${content.slugMismatches.length} documents have a folder name different from reference` })
  if (images.unresolved.length) result.push({ kind: "unresolved-images", summary: `${images.unresolved.length} local image references cannot be resolved` })
  const nonPadded = parsed.fieldStats.date?.formats?.["date-non-padded"] || parsed.fieldStats["paragraphs[].date"]?.formats?.["date-non-padded"] || 0
  if (nonPadded) result.push({ kind: "date-formats", summary: `${nonPadded} date values use non-zero-padded YYYY-M-D format` })
  const underscored = Object.keys(parsed.fieldStats).filter(field => field.split(".").some(part => part.replace("[]", "").startsWith("_")))
  if (underscored.length) result.push({ kind: "legacy-underscore-fields", summary: `Fields requiring manual review: ${underscored.join(", ")}` })
  result.push({ kind: "exhibitions-excluded", summary: "Exhibitions are explicitly outside migration scope. Ignore content/pageTexts/exhibitions/** and do not derive exhibitions from biography prose; future data will come directly from Directus" })
  result.push({ kind: "legacy-dimension-fields-excluded", summary: "Scalar artworks.height_cm/width_cm/depth_cm are temporary preservation fields and are explicitly ignored; only artwork_dimensions will be populated" })
  return result
}

function main() {
  if (!fs.existsSync(schemaPath)) throw new Error(`Missing schema: ${relative(schemaPath)}`)
  const schema = analyseSchema()
  const parsed = parseDocuments()
  const content = analyseContent(parsed.documents)
  const images = analyseImages(parsed.documents)
  const requiredWithoutOrigin = mandatoryWithoutOrigin(schema)
  const inconsistencies = buildInconsistencies(content, parsed, images)
  const analysis = {
    generatedAt: new Date().toISOString(),
    analyzer: "migration/analyse-content.mjs",
    constraints: { httpRequests: false, directusMutations: false, sourceContentMutations: false },
    sourceOfTruth: "migration/directus-schema.json",
    languageAssessment: { automaticTranslationLanguage: "ca", confidence: "confirmed", generateOtherLanguages: false, note: "Import existing source content as ca only; preserve foreign-language quotations/titles verbatim and generate no es/en text." },
    schema,
    content,
    frontmatter: { fields: parsed.fieldStats, parseErrors: parsed.parseErrors },
    images,
    mappings,
    requiredWithoutOrigin,
    inconsistencies,
  }
  fs.writeFileSync(reportPaths.json, `${JSON.stringify(analysis, (_key, value) => jsonValue(value), 2)}\n`, "utf8")
  fs.writeFileSync(reportPaths.analysis, createAnalysisMarkdown(analysis), "utf8")
  fs.writeFileSync(reportPaths.mapping, createMappingMarkdown(analysis), "utf8")
  console.log(JSON.stringify({
    documents: content.totalDocuments,
    byType: content.byType,
    images: images.total,
    unresolvedImages: images.unresolved.length,
    duplicateReferences: content.duplicateReferences.length,
    outputs: Object.values(reportPaths).map(relative),
  }, null, 2))
}

main()
