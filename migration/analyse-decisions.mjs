#!/usr/bin/env node

/** Local-only decision report generator. No HTTP and no Directus mutations. */
import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import yaml from "js-yaml"

const root = path.resolve(import.meta.dirname, "..")
const contentRoot = path.join(root, "content")
const schemaPath = path.join(root, "migration", "directus-schema.json")
const outputPath = path.join(root, "migration", "migration-decisions.md")
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".tif", ".tiff"])
const rel = file => path.relative(root, file).split(path.sep).join("/")
const array = value => Array.isArray(value) ? value : value == null ? [] : [value]
const unique = values => [...new Set(values)]
const sorted = values => [...values].sort((a, b) => String(a).localeCompare(String(b), "ca"))
const esc = value => String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ")
const code = value => `\`${String(value ?? "").replace(/`/g, "\\`")}\``
const valueType = value => value === null ? "null" : value instanceof Date ? "date" : Array.isArray(value) ? "array" : typeof value

function walk(directory, predicate = () => true) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(target, predicate) : predicate(target) ? [target] : []
  })
}

function detectType(file) {
  const name = rel(file)
  if (/^content\/paints\/.+\/paint\.mdx?$/i.test(name)) return "artworks"
  if (/^content\/series\/.+\/serie\.mdx?$/i.test(name)) return "series"
  if (/^content\/pageTexts\//i.test(name)) return "pages"
  if (/^content\/blog\//i.test(name)) return "blog"
  return "other"
}

function loadDocuments() {
  return walk(contentRoot, file => [".md", ".mdx"].includes(path.extname(file).toLowerCase())).map(file => {
    const parsed = matter(fs.readFileSync(file, "utf8"), { engines: { yaml: source => yaml.load(source) || {} } })
    return { file, path: rel(file), type: detectType(file), data: parsed.data || {}, body: parsed.content }
  })
}

const docs = loadDocuments()
const artworks = docs.filter(doc => doc.type === "artworks")
const seriesDocs = docs.filter(doc => doc.type === "series")
const pageDocs = docs.filter(doc => doc.type === "pages")
const blogDocs = docs.filter(doc => doc.type === "blog")
const schema = (JSON.parse(fs.readFileSync(schemaPath, "utf8")).data)
const schemaCollections = new Set(schema.collections.map(item => item.collection))

function listDocs(items) {
  return items.length ? items.map(item => `- ${item.path}`).join("\n") : "- None"
}

function structuralSignature(value) {
  if (Array.isArray(value)) return `[${unique(value.map(structuralSignature)).sort().join(" | ")}]`
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return `{${Object.keys(value).sort().map(key => `${key}:${structuralSignature(value[key])}`).join(",")}}`
  }
  return valueType(value)
}

function groupedValues(items, getter) {
  const groups = new Map()
  for (const item of items) {
    const value = getter(item)
    const key = value === undefined ? "<absent>" : value === null ? "<null>" : value === "" ? "<empty>" : String(value)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b, "ca"))
}

function caseVariants(groups) {
  const folded = new Map()
  for (const [value, items] of groups) {
    if (value.startsWith("<")) continue
    const key = value.toLocaleLowerCase("ca-ES")
    if (!folded.has(key)) folded.set(key, [])
    folded.get(key).push({ value, count: items.length })
  }
  return [...folded.values()].filter(entries => entries.length > 1)
}

function hideSection() {
  const types = [
    ["artworks", artworks], ["series", seriesDocs], ["pages", pageDocs], ["blog", blogDocs],
  ]
  return types.map(([name, items]) => {
    const withHide = items.filter(item => Object.hasOwn(item.data, "hide"))
    const trueItems = items.filter(item => item.data.hide === true)
    const falseItems = items.filter(item => item.data.hide === false)
    const missing = items.filter(item => !Object.hasOwn(item.data, "hide"))
    const other = withHide.filter(item => ![true, false].includes(item.data.hide))
    return `### ${name}\n\n- Total: **${items.length}**\n- With \`hide\`: **${withHide.length}**\n- Values: ${unique(withHide.map(item => JSON.stringify(item.data.hide))).join(", ") || "none"}\n- \`hide=true\`: **${trueItems.length}**\n${listDocs(trueItems)}\n- \`hide=false\`: **${falseItems.length}**\n${listDocs(falseItems)}\n- Missing \`hide\`: **${missing.length}**\n${listDocs(missing)}\n- Other values: **${other.length}**\n${listDocs(other)}`
  }).join("\n\n")
}

function dimensionsSection() {
  const withSizes = artworks.filter(item => Array.isArray(item.data.sizes))
  const one = withSizes.filter(item => item.data.sizes.length === 1)
  const multiple = withSizes.filter(item => item.data.sizes.length > 1)
  const none = artworks.filter(item => !Array.isArray(item.data.sizes) || item.data.sizes.length === 0)
  const signatures = groupedValues(withSizes, item => structuralSignature(item.data.sizes))
  const strange = withSizes.filter(item => item.data.sizes.some(size => {
    const cm = size?.cm
    const unexpectedKeys = cm ? Object.keys(cm).filter(key => !["height", "width", "depth"].includes(key)) : []
    return !cm || typeof cm.height !== "number" || typeof cm.width !== "number" || (cm.depth !== undefined && typeof cm.depth !== "number") || unexpectedKeys.length > 0
  }))
  const signatureRows = signatures.map(([signature, items]) => `| ${esc(signature)} | ${items.length} | ${esc(items.slice(0, 3).map(item => item.data.reference).join(", "))} |`).join("\n")
  const multipleBlocks = multiple.map(item => `### ${item.data.reference || "<no reference>"} — ${item.data.title || "<no title>"}\n\nSource: \`${item.path}\`\n\n\`\`\`json\n${JSON.stringify(item.data.sizes, null, 2)}\n\`\`\``).join("\n\n")
  return `Directus now supports one ordered \`artwork_dimensions\` row per \`sizes[]\` element, so multi-panel values can be preserved without flattening. The temporary scalar \`artworks.height_cm/width_cm/depth_cm\` fields are explicitly ignored during migration and will be removed manually afterwards.\n\n- One size element: **${one.length}**\n- Multiple size elements: **${multiple.length}**\n- Missing or empty sizes: **${none.length}**\n- Incomplete or strange: **${strange.length}** (includes legacy \`breadth\`, which is not silently treated as Directus \`depth_cm\`)\n${listDocs(strange)}\n\n| Structural format | Count | Example references |\n|---|---:|---|\n${signatureRows}\n\n## Multi-size artworks\n\n${multipleBlocks || "None"}`
}

function seriesSection() {
  const groups = groupedValues(artworks, item => item.data.classification?.serie)
  const definitions = seriesDocs.map(item => ({ reference: item.data.reference, title: item.data.title, serie: item.data.serie, path: item.path }))
  const rows = groups.map(([value, items]) => {
    let candidates = []
    let confidence = "none"
    let note = "No exact or case-only match"
    if (!value.startsWith("<")) {
      candidates = definitions.filter(def => [def.reference, def.title, def.serie].some(candidate => candidate === value))
      if (candidates.length === 1) confidence = "high", note = "Exact match against series reference/title/serie"
      else if (!candidates.length) {
        candidates = definitions.filter(def => [def.reference, def.title, def.serie].some(candidate => String(candidate || "").toLowerCase() === value.toLowerCase()))
        if (candidates.length === 1) confidence = "probable", note = "Case-only match; requires confirmation"
      }
    }
    return `| ${esc(value)} | ${items.length} | ${esc(items.slice(0, 4).map(item => item.data.reference).join(", "))} | ${esc(candidates.map(item => item.reference).join(", ") || "—")} | ${confidence} | ${note} |`
  }).join("\n")
  const definitionRows = definitions.map(item => `| ${esc(item.reference)} | ${esc(item.title)} | ${esc(item.serie)} | ${item.path} |`).join("\n")
  const variants = caseVariants(groups)
  return `The decided destination is \`artworks.primary_serie\`; \`artworks.alternative_series\` remains empty. No fuzzy matching is used.\n\n### Legacy values and candidate mapping\n\n| Legacy value | Count | Artwork examples | Candidate series reference | Confidence | Notes |\n|---|---:|---|---|---|---|\n${rows}\n\n### Series definitions\n\n| Reference | Title | Legacy serie field | Document |\n|---|---|---|---|\n${definitionRows}\n\n### Case-only variants\n\n${variants.length ? variants.map(group => `- ${group.map(item => `${code(item.value)} (${item.count})`).join(", ")}`).join("\n") : "- None"}`
}

function vocabularySection() {
  const specs = [
    ["technique", item => item.data.classification?.technique, "artwork_tecniques"],
    ["style", item => item.data.classification?.style, "artwork_styles"],
    ["surface", item => item.data.classification?.surface, "artwork_surfaces"],
    ["composition", item => item.data.classification?.composition, "artwork_composition"],
    ["classification.tags", item => item.data.classification?.tags, "tags"],
    ["tags", item => item.data.tags, "tags"],
  ]
  return specs.map(([name, getter, collection]) => {
    const expanded = artworks.flatMap(item => array(getter(item)).map(value => ({ item, value })))
    const groups = groupedValues(expanded, entry => entry.value)
    const rows = groups.map(([value, entries]) => {
      const compound = /\.(with|and)\b|\b(with|and)\b/i.test(value)
      const proposedParts = compound ? value.split(/\.(?:with|and)/i) : []
      return `| ${esc(value)} | ${entries.length} | ${esc(entries.slice(0, 4).map(entry => entry.item.data.reference).join(", "))} | ${compound ? "yes" : ""} | ${esc(proposedParts.join(" + "))} |`
    }).join("\n") || "| — | 0 | — | — | — |"
    const variants = caseVariants(groups)
    const normalized = new Map()
    for (const [value] of groups) {
      if (value.startsWith("<")) continue
      const key = value.toLowerCase().replace(/[^a-z0-9à-ÿ]+/gi, "")
      if (!normalized.has(key)) normalized.set(key, [])
      normalized.get(key).push(value)
    }
    const possibleDuplicates = [...normalized.values()].filter(values => unique(values).length > 1)
    return `### ${name} → ${collection}\n\nSchema collection exists: **${schemaCollections.has(collection) ? "yes" : "no"}**. The schema contains no vocabulary records, so destination values cannot be verified without forbidden HTTP access.\n\n| Exact value | Count | Artwork examples | Compound | Proposed parts (not a decision) |\n|---|---:|---|---:|---|\n${rows}\n\n- Case-only variants: ${variants.length ? variants.map(group => group.map(item => item.value).join(" / ")).join("; ") : "none"}\n- Possible normalized duplicates: ${possibleDuplicates.length ? possibleDuplicates.map(values => values.join(" / ")).join("; ") : "none"}`
  }).join("\n\n")
}

function quotesSection() {
  const withField = artworks.filter(item => Object.hasOwn(item.data, "quote"))
  const structures = groupedValues(withField, item => structuralSignature(item.data.quote))
  const authors = groupedValues(withField.filter(item => item.data.quote?.author), item => item.data.quote.author)
  const textNoAuthor = withField.filter(item => item.data.quote?.text && !item.data.quote?.author)
  const authorNoText = withField.filter(item => item.data.quote?.author && !item.data.quote?.text)
  const empty = withField.filter(item => !item.data.quote || (!item.data.quote.text && !item.data.quote.author))
  const genericPattern = /^(an[oò]nim|anonymous|an[oó]nimo|desconegut|desconocido|unknown)$/i
  const generic = authors.filter(([author]) => genericPattern.test(author))
  return `Decision already made: \`quote.author\` populates both \`artworks.quote_author\` and Catalan \`artworks_translations.quote_author\`; \`quote.text\` populates Catalan \`artworks_translations.quote_text\`. No values are translated.\n\n- Total artworks: **${artworks.length}**\n- Artworks with a \`quote\` field: **${withField.length}**\n- Text without author: **${textNoAuthor.length}**\n${listDocs(textNoAuthor)}\n- Author without text: **${authorNoText.length}**\n${listDocs(authorNoText)}\n- Empty quote structures: **${empty.length}**\n${listDocs(empty)}\n\n### Structures\n\n${structures.map(([signature, items]) => `- ${code(signature)}: ${items.length}`).join("\n") || "- None"}\n\n### Authors\n\n| Exact author | Count | Artwork examples | Generic / potentially translatable |\n|---|---:|---|---:|\n${authors.map(([author, items]) => `| ${esc(author)} | ${items.length} | ${esc(items.slice(0, 4).map(item => item.data.reference).join(", "))} | ${genericPattern.test(author) ? "yes" : ""} |`).join("\n") || "| — | 0 | — | — |"}\n\nGeneric values found: ${generic.length ? generic.map(([author]) => code(author)).join(", ") : "none"}.`
}

function sellingSection() {
  const withSelling = artworks.filter(item => item.data.sellingData && typeof item.data.sellingData === "object")
  const states = groupedValues(withSelling, item => item.data.sellingData.productState)
  const price = withSelling.filter(item => Object.hasOwn(item.data.sellingData, "priceEur"))
  const show = withSelling.filter(item => Object.hasOwn(item.data.sellingData, "showPrice"))
  const fields = sorted(unique(withSelling.flatMap(item => Object.keys(item.data.sellingData))))
  const soldPublic = withSelling.filter(item => /sold/i.test(item.data.sellingData.productState || "") && item.data.sellingData.showPrice === true)
  const showNoPrice = withSelling.filter(item => item.data.sellingData.showPrice === true && !Object.hasOwn(item.data.sellingData, "priceEur"))
  const priceNoShow = withSelling.filter(item => Object.hasOwn(item.data.sellingData, "priceEur") && !Object.hasOwn(item.data.sellingData, "showPrice"))
  const known = new Set(["ForSale", "Sold"])
  const unknown = withSelling.filter(item => item.data.sellingData.productState && !known.has(item.data.sellingData.productState))
  return `- Artworks with \`sellingData\`: **${withSelling.length}** / ${artworks.length}\n- \`priceEur\` present: **${price.length}**\n- \`showPrice\` present: **${show.length}**\n- Fields found: ${fields.map(code).join(", ")}\n\n| productState | Count | Examples |\n|---|---:|---|\n${states.map(([state, items]) => `| ${esc(state)} | ${items.length} | ${esc(items.slice(0, 5).map(item => item.data.reference).join(", "))} |`).join("\n")}\n\n### Suspicious combinations\n\n- Sold with public price: **${soldPublic.length}**\n${listDocs(soldPublic)}\n- \`showPrice=true\` without \`priceEur\`: **${showNoPrice.length}**\n${listDocs(showNoPrice)}\n- \`priceEur\` present but \`showPrice\` absent: **${priceNoShow.length}**\n${listDocs(priceNoShow)}\n- Unknown product state: **${unknown.length}**\n${listDocs(unknown)}`
}

function biographySection() {
  const about = pageDocs.find(item => item.data.reference === "about")
  const paragraphs = array(about?.data.paragraphs)
  const wrapped = paragraphs.map((data, index) => ({ data, index, path: `${about?.path || "about"}#paragraph-${index + 1}` }))
  const structures = groupedValues(wrapped, item => structuralSignature(item.data))
  const noSubtitle = wrapped.filter(item => !item.data.subtitle)
  const noText = wrapped.filter(item => !item.data.text)
  const withImage = wrapped.filter(item => item.data.image)
  const year = wrapped.filter(item => /^\d{4}$/.test(String(item.data.title || "")))
  const interval = wrapped.filter(item => /^\d{4}\s*[-–—/]\s*\d{2,4}$/.test(String(item.data.title || "")))
  const notDirect = wrapped.filter(item => !/^\d{4}(\s*[-–—/]\s*\d{2,4})?$/.test(String(item.data.title || "")) || !item.data.subtitle || !item.data.text)
  const titleGroups = groupedValues(wrapped, item => item.data.title)
  return `- Total paragraphs: **${paragraphs.length}**\n- Structural formats: **${structures.length}**\n${structures.map(([signature, items]) => `  - ${code(signature)}: ${items.length}`).join("\n")}\n- Title values formatted as a single year: **${year.length}**\n- Title values formatted as year intervals: **${interval.length}**\n- Missing subtitle: **${noSubtitle.length}**\n${listDocs(noSubtitle)}\n- Missing text: **${noText.length}**\n${listDocs(noText)}\n- Non-empty image: **${withImage.length}**\n${listDocs(withImage)}\n- Not directly convertible without inventing required values: **${notDirect.length}**\n${listDocs(notDirect)}\n\n### Title values\n\n| Exact title | Count | Format |\n|---|---:|---|\n${titleGroups.map(([title, items]) => `| ${esc(title)} | ${items.length} | ${/^\d{4}$/.test(title) ? "year" : /^\d{4}\s*[-–—/]\s*\d{2,4}$/.test(title) ? "year interval" : "other"} |`).join("\n")}\n\nDirectus requires \`reference\`, \`reference_date\`, Catalan \`year_label\`, and Catalan \`title\`. This report does not invent them.`
}

function slugify(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function pressSection() {
  const press = pageDocs.find(item => item.data.reference === "press")
  const entries = array(press?.data.paragraphs).map((data, index) => ({ data, index, path: `${press?.path || "press"}#paragraph-${index + 1}` }))
  const fields = sorted(unique(entries.flatMap(item => Object.keys(item.data))))
  const fieldRows = fields.map(field => {
    const present = entries.filter(item => Object.hasOwn(item.data, field) && item.data[field] !== "")
    return `| ${field} | ${present.length} | ${entries.length - present.length} |`
  }).join("\n")
  const missing = field => entries.filter(item => !item.data[field])
  const dateFormats = groupedValues(entries, item => {
    const value = item.data.date
    if (!value) return "<absent>"
    if (value instanceof Date) return "parsed YYYY-MM-DD date"
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return "YYYY-MM-DD"
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(String(value))) return "YYYY-M-D"
    return "other"
  })
  const domains = new Map()
  for (const item of entries.filter(item => item.data.link)) {
    let domain
    try { domain = new URL(item.data.link).hostname.toLowerCase().replace(/^www\./, "") } catch { domain = "<invalid-url>" }
    if (!domains.has(domain)) domains.set(domain, [])
    domains.get(domain).push(item)
  }
  const domainRows = [...domains].sort(([a], [b]) => a.localeCompare(b)).map(([domain, items]) => {
    const authors = unique(items.map(item => item.data.author).filter(Boolean))
    const proposal = authors.length === 1 ? authors[0] : domain
    return `| ${domain} | ${items.length} | ${esc(authors.join(", "))} | ${esc(proposal)} | proposal only |`
  }).join("\n")
  const titleGroups = groupedValues(entries.filter(item => item.data.title), item => item.data.title).filter(([_title, items]) => items.length > 1)
  const slugGroups = new Map()
  for (const item of entries) {
    const slug = slugify(item.data.title)
    if (!slugGroups.has(slug)) slugGroups.set(slug, [])
    slugGroups.get(slug).push(item)
  }
  const collisions = [...slugGroups].filter(([slug, items]) => slug && items.length > 1)
  return `- Total articles: **${entries.length}**\n\n| Field | Present | Missing/empty |\n|---|---:|---:|\n${fieldRows}\n\n- Missing date: **${missing("date").length}**\n${listDocs(missing("date"))}\n- Missing title: **${missing("title").length}**\n${listDocs(missing("title"))}\n- Missing author: **${missing("author").length}**\n${listDocs(missing("author"))}\n- Missing link: **${missing("link").length}**\n${listDocs(missing("link"))}\n\n### Date formats\n\n${dateFormats.map(([format, items]) => `- ${format}: ${items.length}`).join("\n")}\n\n### Domains and proposed media values\n\n| Domain | Count | Existing authors | Proposed media | Status |\n|---|---:|---|---|---|\n${domainRows}\n\n### Duplicate risk\n\n- Exact duplicate titles: **${titleGroups.length}**\n${titleGroups.length ? titleGroups.map(([title, items]) => `  - ${code(title)}: ${items.map(item => item.path).join(", ")}`).join("\n") : "  - None"}\n- Slug collisions: **${collisions.length}**\n${collisions.length ? collisions.map(([slug, items]) => `  - ${code(slug)}: ${items.map(item => item.data.title).join(" / ")}`).join("\n") : "  - None"}`
}

function imageRefsFor(doc) {
  const result = []
  const visit = (value, field) => {
    if (typeof value === "string" && imageExtensions.has(path.extname(value.split(/[?#]/)[0]).toLowerCase())) result.push({ field, value })
    else if (Array.isArray(value)) value.forEach((entry, index) => visit(entry, `${field}[${index}]`))
    else if (value && typeof value === "object" && !(value instanceof Date)) Object.entries(value).forEach(([key, entry]) => visit(entry, field ? `${field}.${key}` : key))
  }
  visit(doc.data, "")
  return result
}

function resolveImage(doc, value) {
  const candidates = [path.resolve(path.dirname(doc.file), value), path.resolve(contentRoot, value), path.resolve(root, "static", value)]
  const exact = candidates.find(file => fs.existsSync(file) && fs.statSync(file).isFile())
  if (exact) return { resolved: rel(exact), caseMismatch: false }
  for (const candidate of candidates) {
    const directory = path.dirname(candidate)
    if (!fs.existsSync(directory)) continue
    const expected = path.basename(candidate).toLowerCase()
    const actual = fs.readdirSync(directory).find(name => name.toLowerCase() === expected)
    if (actual) return { resolved: rel(path.join(directory, actual)), caseMismatch: actual !== path.basename(candidate) }
  }
  return { resolved: null, caseMismatch: false }
}

function imagesSection() {
  const uses = docs.flatMap(doc => imageRefsFor(doc).map(ref => ({ doc, ...ref, ...resolveImage(doc, ref.value) })))
  const categories = [
    ["Artwork main images", uses.filter(item => item.doc.type === "artworks" && item.field === "image.main")],
    ["Artwork other images", uses.filter(item => item.doc.type === "artworks" && item.field.startsWith("image.otherImages"))],
    ["SEO images", uses.filter(item => /(^|\.)seo\.image$/.test(item.field))],
    ["Series images", uses.filter(item => item.doc.type === "series" && item.field.startsWith("image."))],
    ["Page images", uses.filter(item => item.doc.type === "pages")],
  ]
  const unresolved = uses.filter(item => !item.resolved)
  const caseMismatch = uses.filter(item => item.caseMismatch)
  const reuse = new Map()
  for (const item of uses.filter(item => item.resolved)) {
    if (!reuse.has(item.resolved)) reuse.set(item.resolved, [])
    reuse.get(item.resolved).push(item)
  }
  const multiContent = [...reuse].filter(([_file, items]) => unique(items.map(item => item.doc.path)).length > 1)
  return `${categories.map(([name, items]) => `- ${name}: **${items.length}** references, **${items.filter(item => item.resolved).length}** resolved`).join("\n")}\n- Missing file references: **${unresolved.length}**\n${unresolved.map(item => `  - ${item.doc.path} — ${code(item.field)} = ${code(item.value)}`).join("\n") || "  - None"}\n- Case-only path mismatches: **${caseMismatch.length}**\n${caseMismatch.map(item => `  - ${item.doc.path}: ${code(item.value)} → ${code(item.resolved)}`).join("\n") || "  - None"}\n- Same image reused by different content: **${multiContent.length}**\n${multiContent.map(([file, items]) => `  - ${file}: ${unique(items.map(item => item.doc.path)).join(", ")}`).join("\n") || "  - None"}`
}

function blogSection() {
  return `- Documents: **${blogDocs.length}**\n\n| Document | Reference | Title | Frontmatter fields | Body | Images |\n|---|---|---|---|---:|---:|\n${blogDocs.map(item => `| ${item.path} | ${esc(item.data.reference || "—")} | ${esc(item.data.title || "—")} | ${esc(Object.keys(item.data).join(", "))} | ${item.body.trim() ? "yes" : "no"} | ${imageRefsFor(item).length} |`).join("\n")}\n\nInventory only. No Directus collection is proposed.`
}

const report = `# Decisions review before MIGRATION_SPEC

Generated locally by \`node migration/analyse-decisions.mjs\`. No HTTP requests were made. No source content or Directus schema was modified.

## Confirmed constraints

- One legacy series only: \`classification.serie → artworks.primary_serie\`.
- \`artworks.alternative_series\` remains empty during migration.
- \`quote.author\` populates both base and Catalan translation author fields.
- Existing Catalan values use \`languages_code=ca\`; no Spanish or English text is generated.
- Exhibitions are excluded entirely; placeholder Gatsby data is not migrated.
- Temporary scalar \`artworks.height_cm/width_cm/depth_cm\` fields are ignored; only \`artwork_dimensions\` is populated.

## 1. STATUS / HIDE

${hideSection()}

No final \`hide → status\` mapping is selected here.

## 2. DIMENSIONS DE LES OBRES

${dimensionsSection()}

No total dimensions are calculated.

## 3. SERIES

${seriesSection()}

## 4. VOCABULARIS TÈCNICS

${vocabularySection()}

No values are merged or corrected automatically.

## 5. QUOTES

${quotesSection()}

## 6. SELLING DATA

${sellingSection()}

## 7. BIOGRAPHY

${biographySection()}

## 8. PRESS

${pressSection()}

## 9. IMATGES

${imagesSection()}

No files are copied or moved.

## 10. BLOG

${blogSection()}

## Decisions pendents abans de MIGRATION_SPEC

### CRÍTICA

- Define the exact \`hide\`/missing-hide → Directus \`status\` policy for artworks, series and pages.

- Decide whether the legacy \`sizes[].cm.breadth\` field means Directus \`depth_cm\`; no automatic equivalence is assumed.
- Decide how to generate stable, unique \`biography_events.reference\` and what \`reference_date\` means when the source only provides a year; also decide a required title policy for entries without subtitle.
- Correct or explicitly map the three malformed multi-image references before import; source files must not be guessed silently.

### IMPORTANT

- Approve exact normalization/splitting rules for compound technical vocabularies (for example \`.with\` and \`.and\`) and confirm destination vocabulary IDs later without fuzzy matching.
- Confirm each legacy series value → exact series reference mapping shown above; the relation policy itself is already decided.
- Define legacy \`productState\` → Directus \`sale_status\` and visibility/default policies for \`show_sale_status\` and missing price flags.
- Define stable \`press_articles.reference\`, approve domain/author → \`media\`, and choose dateTime/timezone normalization.

### MENOR

- Decide whether legacy folder/\`pageName\`/\`url\` mismatches are only historical aliases or must be retained before canonicalizing on \`reference\`.
- Decide whether legacy underscored fields such as \`_subtitle\` are discarded or retained manually.
- Decide whether blog documents are explicitly excluded from this migration; no new Directus collection is proposed here.
`

fs.writeFileSync(outputPath, report, "utf8")
console.log(JSON.stringify({ output: rel(outputPath), documents: docs.length, artworks: artworks.length, series: seriesDocs.length, pages: pageDocs.length, blog: blogDocs.length }, null, 2))
