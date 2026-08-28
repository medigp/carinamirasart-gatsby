const { createRemoteFileNode } = require("gatsby-source-filesystem")

const SUPPORTED_LANGUAGES = ["ca", "es", "en"]
const DEFAULT_LANGUAGE = "ca"

const array = value => (Array.isArray(value) ? value : [])
const trimTrailingSlash = value => String(value || "").replace(/\/$/, "")
const localizedPrefix = lang => (lang === DEFAULT_LANGUAGE ? "" : `/${lang}`)
const localizedPath = (path, lang) => `${localizedPrefix(lang)}${path}`.toLowerCase()
const relationId = (value, junctionField) => {
  if (!value) return null
  const related = junctionField ? value[junctionField] : value
  if (!related) return null
  return typeof related === "object" ? related.id : related
}
const translationLanguage = translation =>
  translation?.languages_code?.language || translation?.languages_code || ""
const selectTranslation = (translations, lang) => {
  const available = array(translations)
  return available.find(entry => translationLanguage(entry) === lang)
    || available.find(entry => translationLanguage(entry) === DEFAULT_LANGUAGE)
    || available[0]
    || {}
}
const modifiedDate = item => item.date_updated || item.date_created || item.date || new Date().toISOString()
const configuredLanguages = () => {
  const requested = String(process.env.DIRECTUS_LANGUAGES || DEFAULT_LANGUAGE)
    .split(",")
    .map(language => language.trim().toLowerCase())
    .filter(Boolean)
  const unsupported = requested.filter(language => !SUPPORTED_LANGUAGES.includes(language))
  if (unsupported.length) {
    throw new Error(`Idiomes no suportats a DIRECTUS_LANGUAGES: ${unsupported.join(", ")}`)
  }
  return [...new Set(requested)]
}

const directusAuthorization = () => `Bearer ${process.env.DIRECTUS_TOKEN}`

const fetchCollection = async (collection, fields, reporter) => {
  const url = new URL(`${trimTrailingSlash(process.env.DIRECTUS_URL)}/items/${collection}`)
  url.searchParams.set("filter[status][_eq]", "published")
  url.searchParams.set("fields", fields.join(","))
  url.searchParams.set("limit", "-1")

  let response
  try {
    response = await fetch(url, {
      headers: { Authorization: directusAuthorization(), Accept: "application/json" },
    })
  } catch (error) {
    reporter.panicOnBuild(`[Directus] No s'ha pogut connectar a ${collection}: ${error.message}`)
  }
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null)
    const message = errorPayload?.errors?.[0]?.message || `${response.status} ${response.statusText}`
    reporter.panicOnBuild(`[Directus] Error consultant ${collection}: ${message}`)
  }
  const payload = await response.json()
  return array(payload.data)
}

const downloadFile = async (fileValue, parentNodeId, helpers) => {
  const fileId = typeof fileValue === "object" ? fileValue?.id : fileValue
  if (!fileId) return null
  try {
    return await createRemoteFileNode({
      url: `${trimTrailingSlash(process.env.DIRECTUS_URL)}/assets/${fileId}`,
      httpHeaders: { Authorization: directusAuthorization() },
      parentNodeId,
      createNode: helpers.actions.createNode,
      createNodeId: helpers.createNodeId,
      getCache: helpers.getCache,
      reporter: helpers.reporter,
    })
  } catch (error) {
    helpers.reporter.panicOnBuild(`[Directus] No s'ha pogut baixar l'asset ${fileId}: ${error.message}`)
  }
}

const createImages = async (item, translation, parentNodeId, helpers) => {
  const mainFile = await downloadFile(item.main_image, parentNodeId, helpers)
  const otherFiles = []
  const otherNodeIds = []
  const orderedOtherImages = [...array(item.other_images)].sort(dimensionOrder)
  for (const relation of orderedOtherImages) {
    const file = await downloadFile(relationId(relation, "directus_files_id"), parentNodeId, helpers)
    if (file) {
      otherFiles.push(file.relativePath)
      otherNodeIds.push(file.id)
    }
  }
  return {
    main: mainFile?.relativePath || null,
    otherImages: otherFiles,
    image_alt_text: translation.image_alt_text || translation.title || item.reference,
    _mainNodeId: mainFile?.id || null,
    _otherNodeIds: otherNodeIds,
  }
}
const createSeo = async (item, translation, fallbackImage, parentNodeId, helpers) => {
  const file = await downloadFile(item.seo_image, parentNodeId, helpers)
  return {
    description: translation.seo_description || translation.description || "",
    keywords: array(translation.seo_keywords),
    image: file?.relativePath || fallbackImage || null,
    _imageNodeId: file?.id || null,
  }
}
const breadcrumbs = (serieReference, serieTitle, pageTitle, lang) => {
  const prefix = localizedPrefix(lang)
  const values = [
    { text: "Gallery", url: `${prefix}/gallery/` },
    { text: serieTitle || serieReference, url: `${prefix}/${serieReference}/` },
  ]
  if (pageTitle) values.push({ text: pageTitle, url: "" })
  return values
}

const tagNames = (relations, lang) => array(relations).map(relation => {
  const tag = relation.tags_id || relation
  const translation = selectTranslation(tag.translations, lang)
  return translation.name || tag.tag
}).filter(Boolean)

const relationArray = value => (Array.isArray(value) ? value : (value ? [value] : []))

const relatedNames = (relations, relationField, lang) => relationArray(relations).map(relation => {
  const item = relation[relationField] || relation
  const translation = selectTranslation(item.translations, lang)
  return translation.name || item.reference
}).filter(Boolean)

const formatLocalizedList = (values, lang) => {
  const locale = { ca: "ca-ES", es: "es-ES", en: "en" }[lang] || lang
  const conjunction = { ca: "i", es: "y", en: "and" }[lang] || "and"
  const normalized = [...new Set(array(values).map(value => String(value || "").trim()).filter(Boolean))]
    .map(value => value.toLocaleLowerCase(locale))
  if (!normalized.length) return undefined
  let result = normalized[0]
  if (normalized.length === 2) {
    result = `${normalized[0]} ${conjunction} ${normalized[1]}`
  } else if (normalized.length > 2) {
    result = `${normalized.slice(0, -1).join(", ")} ${conjunction} ${normalized.at(-1)}`
  }
  return result.charAt(0).toLocaleUpperCase(locale) + result.slice(1)
}

const toInches = value => Math.round((value / 2.54) * 100) / 100
const dimensionOrder = (left, right) => {
  const leftSort = Number.isFinite(Number(left?.sort)) ? Number(left.sort) : Number.MAX_SAFE_INTEGER
  const rightSort = Number.isFinite(Number(right?.sort)) ? Number(right.sort) : Number.MAX_SAFE_INTEGER
  return leftSort - rightSort || Number(left?.id || 0) - Number(right?.id || 0)
}
const artworkOrientation = sizes => {
  if (!sizes.length) return "Free"
  let height = 0
  let width = 0
  for (const size of sizes) {
    height += size.cm.height
    width += size.cm.width
  }
  if (height === width) return "Square"
  if (height > width) return "Portrait"
  return "Landscape"
}
const artworkSizes = dimensions => array(dimensions)
  .filter(dimension => dimension?.height_cm !== null && dimension?.height_cm !== undefined
    && dimension?.width_cm !== null && dimension?.width_cm !== undefined)
  .sort(dimensionOrder)
  .map(dimension => {
    const height = Number(dimension.height_cm)
    const width = Number(dimension.width_cm)
    const depth = dimension.depth_cm === null || dimension.depth_cm === undefined
      ? null
      : Number(dimension.depth_cm)
    return {
      cm: { height, width, breadth: depth },
      inch: {
        height: toInches(height),
        width: toInches(width),
        breadth: depth === null ? null : toInches(depth),
      },
    }
  })

const ARTWORK_FIELDS = [
  "id", "reference", "sort", "date", "date_created", "date_updated", "show_on_home",
  "main_image", "other_images.id", "other_images.sort", "other_images.directus_files_id", "seo_image",
  "dimensions.id", "dimensions.sort", "dimensions.height_cm", "dimensions.width_cm", "dimensions.depth_cm",
  "sale_status", "show_sale_status", "price_eur", "show_price", "quote_author", "show_quote",
  "primary_serie.id", "primary_serie.reference",
  "tags.tags_id.tag", "tags.tags_id.translations.languages_code.language", "tags.tags_id.translations.name",
  "technique.artwork_tecniques_id.reference",
  "technique.artwork_tecniques_id.translations.languages_code.language",
  "technique.artwork_tecniques_id.translations.name",
  "styles.artwork_styles_id.reference",
  "styles.artwork_styles_id.translations.languages_code.language",
  "styles.artwork_styles_id.translations.name",
  "surface.artwork_surfaces_id.reference",
  "surface.artwork_surfaces_id.translations.languages_code.language",
  "surface.artwork_surfaces_id.translations.name",
  "composition.reference", "composition.translations.languages_code.language", "composition.translations.name",
  "translations.languages_code.language", "translations.title", "translations.subtitle",
  "translations.description", "translations.body", "translations.image_alt_text",
  "translations.quote_author", "translations.quote_text", "translations.wall_label_title",
  "translations.wall_label_subtitle", "translations.wall_label_description",
  "translations.seo_description", "translations.seo_keywords",
]

const SERIES_FIELDS = [
  "id", "reference", "sort", "date", "date_created", "date_updated", "main_image", "seo_image",
  "quote_author", "show_quote", "translations.languages_code.language", "translations.title",
  "translations.subtitle", "translations.description", "translations.body", "translations.image_alt_text",
  "translations.quote_text", "translations.quote_author", "translations.wall_label_title",
  "translations.wall_label_subtitle", "translations.wall_label_description",
  "translations.seo_description", "translations.seo_keywords",
]

const PAGE_FIELDS = [
  "id", "reference", "sort", "date_created", "date_updated", "main_image", "seo_image",
  "translations.languages_code.language", "translations.title", "translations.subtitle",
  "translations.body", "translations.seo_description", "translations.seo_keywords",
]

const PRESS_FIELDS = [
  "id", "reference", "sort", "reference_date", "date_created", "date_updated",
  "press_media.name",
  "external_url", "image", "translations.languages_code.language", "translations.title",
  "translations.subtitle", "translations.description", "translations.external_url",
  "translations.image_alt_text",
]

const BIOGRAPHY_FIELDS = [
  "id", "reference", "sort", "reference_date", "date_start", "date_end", "date_created",
  "date_updated", "external_url", "image", "translations.languages_code.language",
  "translations.title", "translations.subtitle", "translations.description",
  "translations.external_url", "translations.image_alt_text", "translations.year_label",
]

exports.sourceDirectusNodes = async helpers => {
  const requiredVariables = ["DIRECTUS_URL", "DIRECTUS_TOKEN"]
  const missingVariables = requiredVariables.filter(name => !process.env[name])
  if (missingVariables.length) {
    helpers.reporter.panicOnBuild(`[Directus] Falten variables d'entorn: ${missingVariables.join(", ")}`)
  }

  let languages
  try {
    languages = configuredLanguages()
  } catch (error) {
    helpers.reporter.panicOnBuild(`[Directus] ${error.message}`)
    return
  }

  const [series, artworks, pages, pressArticles, biographyEvents] = await Promise.all([
    fetchCollection("series", SERIES_FIELDS, helpers.reporter),
    fetchCollection("artworks", ARTWORK_FIELDS, helpers.reporter),
    fetchCollection("pages", PAGE_FIELDS, helpers.reporter),
    fetchCollection("press_articles", PRESS_FIELDS, helpers.reporter),
    fetchCollection("biography_events", BIOGRAPHY_FIELDS, helpers.reporter),
  ])
  helpers.reporter.info(`[Directus] ${series.length} series publicades`)
  helpers.reporter.info(`[Directus] ${artworks.length} artworks publicats`)
  helpers.reporter.info(`[Directus] ${pages.length} pages publicades`)
  helpers.reporter.info(`[Directus] ${pressArticles.length} articles de premsa publicats`)
  helpers.reporter.info(`[Directus] ${biographyEvents.length} esdeveniments biogràfics publicats`)
  helpers.reporter.info(`[Directus] generant ${languages.join("/")}`)

  const articlesWithoutMedia = pressArticles.filter(article => !article.press_media?.name)
  if (articlesWithoutMedia.length) {
    helpers.reporter.panicOnBuild(
      `[Directus] Articles de premsa sense press_media.name: ${articlesWithoutMedia.map(article => article.reference).join(", ")}`
    )
  }

  for (const item of pages) {
    for (const lang of languages) {
      const translation = selectTranslation(item.translations, lang)
      const id = helpers.createNodeId(`Directus-PageText-${item.id}-${lang}`)
      const image = await createImages(item, translation, id, helpers)
      const seo = await createSeo(item, translation, image.main, id, helpers)
      seo._imageNodeId ||= image._mainNodeId
      let paragraphs = []
      let sortParagraphs = "DESC"
      if (item.reference === "press") {
        paragraphs = pressArticles.map(article => {
          const text = selectTranslation(article.translations, lang)
          const date = String(article.reference_date || "").slice(0, 10)
          const chronologySort = String(article.sort ?? article.id).padStart(10, "0")
          return {
            date,
            title: text.title || article.reference,
            subtitle: text.subtitle,
            text: text.description,
            media: article.press_media.name,
            link: text.external_url || article.external_url,
            sortText: `${date}-sort-${chronologySort}`,
          }
        })
      } else if (item.reference === "about") {
        paragraphs = biographyEvents.map(event => {
          const text = selectTranslation(event.translations, lang)
          const date = String(event.date_start || event.reference_date || "").slice(0, 10)
          const chronologySort = String(event.sort ?? event.id).padStart(10, "0")
          return {
            title: text.year_label || date.slice(0, 4),
            subtitle: text.subtitle,
            text: text.description,
            date,
            link: text.external_url || event.external_url,
            sortText: `${date}-sort-${chronologySort}`,
          }
        })
      }
      const node = {
        id,
        lang,
        source: "directus",
        directusId: String(item.id),
        reference: item.reference,
        title: translation.title || item.reference,
        subtitle: translation.subtitle,
        body: translation.body,
        image,
        seo,
        paragraphs,
        sortParagraphs,
        lastModificationDate: modifiedDate(item),
        internal: { type: "PageText" },
      }
      node.internal.contentDigest = helpers.createContentDigest(node)
      helpers.actions.createNode(node)
    }
  }

  for (const item of series) {
    for (const lang of languages) {
      const translation = selectTranslation(item.translations, lang)
      const id = helpers.createNodeId(`Directus-Serie-${item.id}-${lang}`)
      const image = await createImages(item, translation, id, helpers)
      const seo = await createSeo(item, translation, image.main, id, helpers)
      seo._imageNodeId ||= image._mainNodeId
      const node = {
        id,
        lang,
        source: "directus",
        directusId: String(item.id),
        hide: false,
        url: localizedPath(`/${item.reference}/`, lang),
        reference: item.reference,
        order: item.sort || 0,
        pageName: item.reference,
        breadcrumbs: breadcrumbs(item.reference, translation.title, null, lang),
        date: item.date,
        serie: item.reference,
        classification: { serie: item.reference },
        image,
        seo,
        title: translation.title || item.reference,
        subtitle: translation.subtitle,
        quote: {
          text: translation.quote_text,
          author: translation.quote_author || item.quote_author,
          showQuote: item.show_quote !== false,
        },
        description: translation.description,
        body: translation.body,
        wallLabel: {
          title: translation.wall_label_title,
          subtitle: translation.wall_label_subtitle,
          description: translation.wall_label_description,
        },
        lastModificationDate: modifiedDate(item),
        internal: { type: "Serie" },
      }
      node.internal.contentDigest = helpers.createContentDigest(node)
      helpers.actions.createNode(node)
    }
  }

  for (const item of artworks) {
    const serieReference = item.primary_serie?.reference || "miscellany"
    const serieItem = series.find(serie => serie.reference === serieReference)
    for (const lang of languages) {
      const translation = selectTranslation(item.translations, lang)
      const serieTranslation = selectTranslation(serieItem?.translations, lang)
      const id = helpers.createNodeId(`Directus-Paint-${item.id}-${lang}`)
      const image = await createImages(item, translation, id, helpers)
      const seo = await createSeo(item, translation, image.main, id, helpers)
      seo._imageNodeId ||= image._mainNodeId
      const sizes = artworkSizes(item.dimensions)
      const node = {
        id,
        lang,
        source: "directus",
        directusId: String(item.id),
        hide: false,
        url: localizedPath(`/item/${item.reference}/`, lang),
        reference: item.reference,
        order: item.sort || 0,
        pageName: item.reference,
        breadcrumbs: breadcrumbs(
          serieReference,
          serieTranslation.title || serieReference,
          translation.title || item.reference,
          lang
        ),
        date: item.date,
        classification: {
          serie: serieReference,
          category: "Painting",
          orientation: artworkOrientation(sizes),
          technique: formatLocalizedList(relatedNames(item.technique, "artwork_tecniques_id", lang), lang),
          composition: formatLocalizedList(relatedNames(item.composition, "artwork_composition_id", lang), lang),
          surface: formatLocalizedList(relatedNames(item.surface, "artwork_surfaces_id", lang), lang),
          style: formatLocalizedList(relatedNames(item.styles, "artwork_styles_id", lang), lang),
          tags: tagNames(item.tags, lang),
        },
        image,
        seo,
        sizes,
        title: translation.title || item.reference,
        subtitle: translation.subtitle,
        quote: {
          text: translation.quote_text,
          author: translation.quote_author || item.quote_author,
          showQuote: item.show_quote !== false,
        },
        description: translation.description,
        body: translation.body,
        wallLabel: {
          title: translation.wall_label_title,
          subtitle: translation.wall_label_subtitle,
          description: translation.wall_label_description,
        },
        sellingData: {
          productState: item.sale_status,
          showProductState: Boolean(item.show_sale_status),
          priceEur: item.price_eur === null ? null : Number(item.price_eur),
          priceDollar: null,
          showPrice: Boolean(item.show_price),
        },
        lastModificationDate: modifiedDate(item),
        showOnMainScreen: Boolean(item.show_on_home),
        internal: { type: "Paint" },
      }
      node.internal.contentDigest = helpers.createContentDigest(node)
      helpers.actions.createNode(node)
    }
  }
}
