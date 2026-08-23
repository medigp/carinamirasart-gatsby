# Proposed Gatsby → Directus mapping

This proposal is based on the real source content and `migration/directus-schema.json`. It does not implement or execute an import.

## Translation policy

Import the existing Catalan source values into `*_translations` using `languages_code=ca`. Do **not** generate or import Spanish or English translations in this phase. Quotations and individual foreign-language titles must remain verbatim; no text should be machine-translated.

## Import-wide rules

### Existing records: append-only

- Before creating anything associated with a source record, look up the destination record by exact `reference`.
- If that reference already exists, **SKIP the entire record**.
- Never update or overwrite an existing record.
- Apply the skip before translations, relations, dimensions or associated files are created.

### Defaults

- When a Directus field has no legacy origin, omit it from the payload so the schema default applies.
- Never invent a value merely to populate an optional or defaulted field.
- If there is no default and the field is nullable, it may remain null.

### Dates and dateTimes

- Normalize every imported Directus `dateTime` value to 12:00 noon in `Europe/Madrid`.
- For PostgreSQL `timestamp without time zone`, send the literal local value `YYYY-MM-DDT12:00:00` without an offset. Respect CET/CEST only for conversions that actually require timezone information.
- Directus `date` fields without time remain `YYYY-MM-DD`.

### Generated references

- When a record lacks a legacy reference and has a complete `reference_date`, generate `YYYYMMDD`.
- Resolve collisions deterministically within the same collection as `YYYYMMDD`, `YYYYMMDD-02`, `YYYYMMDD-03`, and so on, using stable source order.
- A partial date that lacks a reliable month or day is insufficient. Report it for manual decision and do not invent date components.
- Biography events are the explicit exception for year-only legacy values: use synthetic `YYYY-01-01 12:00 Europe/Madrid` solely for ordering, preserve the original visible value in `year_label`, and never present the synthetic date as historically known.

### Rich-text HTML

- Do not store legacy bodies as raw MDX.
- Convert Markdown and compatible MDX syntax to HTML before writing a Directus rich-text HTML field.
- Preserve HTML already present in the body.
- Detect and report JSX/MDX components that cannot be converted automatically; never silently remove their content.

## Detailed mapping

| Content type | Gatsby source | Directus destination | Confidence | Transformation / decision |
|---|---|---|---|---|
| artworks | reference | artworks.reference | safe | none |
| artworks | order | artworks.sort | safe | numeric copy |
| artworks | date | artworks.date | safe | normalize to 12:00 Europe/Madrid, respecting CET/CEST for the date; never use a fixed UTC offset |
| artworks | showOnMainScreen | artworks.show_on_home | safe | rename |
| artworks | hide | artworks.status | safe | true → archived; false or absent → published |
| artworks | title/subtitle/description + MDX body | artworks_translations.title/subtitle/description/body | safe | create only languages_code=ca; convert Markdown/compatible MDX body to HTML, preserve existing HTML, and report unconvertible JSX/MDX without silently dropping it |
| artworks | seo.description/seo.keywords/seo.image | artworks_translations.seo_description/seo_keywords + artworks.seo_image | safe | upload and resolve file IDs |
| artworks | image.main/image.otherImages | artworks.main_image/artworks.other_images via artworks_files | safe | upload files first; map the zero-based legacy array position to artworks_files.sort starting at 1 |
| artworks | sizes[].cm.height/width + array index | artwork_dimensions.height_cm/width_cm/sort linked by artworks_id | safe | create one ordered artwork_dimensions row per sizes[] element; preserve all panels |
| artworks | sizes[].cm.depth or sizes[].cm.breadth | artwork_dimensions.depth_cm | safe | prefer cm.depth; otherwise use legacy cm.breadth as the third dimension/depth; if neither exists omit depth_cm so Directus applies its schema default |
| artworks | none | legacy scalar artworks.height_cm/width_cm/depth_cm | excluded | ignore during migration; fields are temporary preservation fields and will be removed manually after transfer |
| artworks | classification.serie | artworks.primary_serie | safe | resolve case-insensitively against series reference/title; leave alternative_series empty because the legacy model contains one series only |
| artworks | classification.technique/style/composition/surface | technique/styles/composition/surface relations and vocabulary collections | safe | use the explicit table in vocabulary-map-proposal.md; split confirmed compounds; Undefined means no style; never fuzzy-match |
| artworks | classification.orientation | no Directus storage; Gatsby classification.orientation | derived | exclude from storage and derive with the legacy height/width aggregation over ordered sizes: Square, Portrait, Landscape, or Free when unavailable |
| artworks | classification.tags/tags | artworks.tags via artworks_tags and tags(_translations) | safe | no non-empty legacy tags exist, so create no tags or tag relations |
| artworks | sellingData.productState/showProductState/priceEur/showPrice | sale_status/show_sale_status/price_eur/show_price | safe | copy explicit legacy values; omit any absent field so Directus applies its schema default |
| artworks | quote.text | artworks_translations.quote_text | safe | create only languages_code=ca |
| artworks | quote.author | artworks.quote_author and artworks_translations.quote_author | safe | copy the legacy author to both schema fields; create only the ca translation row |
| series | reference/order/date | series.reference/sort/date | safe | copy reference/sort; normalize dateTime values to 12:00 Europe/Madrid, respecting CET/CEST |
| series | title/subtitle/description + body | series_translations.title/subtitle/description/body | safe | create only languages_code=ca; convert Markdown/compatible MDX body to HTML, preserve existing HTML, and report unconvertible JSX/MDX |
| series | image.main + seo.image | series.main_image/seo_image | safe | upload files first |
| series | hide | series.status | safe | true → archived; false or absent → published |
| series | quote.* / seo.* | series(_translations) quote and SEO fields | probable | choose duplicate author field policy |
| pages | reference | pages.reference | safe | none |
| pages | hide | pages.status | safe | true → archived; false or absent → published |
| pages | body | pages_translations.body | safe | create only languages_code=ca; convert Markdown/compatible MDX to HTML, preserve existing HTML, and report unconvertible JSX/MDX |
| pages | seo.* | pages_translations.seo_* + pages.seo_image | safe | upload file first |
| pages | title/subtitle | pages_translations.title/subtitle | probable | some page documents have no title; manual/default title needed |
| biography_events | about.paragraphs[].title | biography_events_translations.year_label | safe | preserve the exact visible legacy value |
| biography_events | about.paragraphs[].subtitle/text | biography_events_translations.title/description | safe | copy subtitle to title when present and text to description; title may be empty and must not be invented (schema still marks title required) |
| biography_events | most precise available legacy date or year_label | biography_events.reference_date | safe | use the precise date when available; otherwise YYYY becomes synthetic YYYY-01-01 12:00 Europe/Madrid for ordering only and must not be presented as historically known |
| biography_events | reference_date | biography_events.reference | safe | generate deterministic YYYYMMDD with -02, -03, ... collisions in stable source order |
| biography_events | about.paragraphs[].image | biography_events.image/images | probable | ignore empty strings; upload files |
| press_articles | press.paragraphs[].date | press_articles.reference_date | safe | zero-pad legacy dates and normalize dateTime to 12:00 Europe/Madrid, respecting CET/CEST |
| press_articles | press.paragraphs[].title/text | press_articles_translations.title/description | safe | create only languages_code=ca and preserve source text verbatim |
| press_articles | press.paragraphs[].author/link | press_articles.author/external_url | safe | rename link |
| press_articles | complete reference_date | press_articles.reference | safe | generate deterministic YYYYMMDD; append -02, -03, ... for same-collection collisions in stable source order |
| press_articles | no explicit source | press_articles.media | manual | required field has no approved legacy mapping; do not infer it from author or domain |
| exhibitions | content/pageTexts/exhibitions/** and exhibition-like prose | none during migration | excluded | do not import placeholder data; future exhibition content will be authored directly in Directus |
| blog | content/blog/** | none | excluded | exclude completely; do not create a collection or import any blog data |

## Safe mappings

- reference → artworks.reference
- order → artworks.sort
- date → artworks.date
- showOnMainScreen → artworks.show_on_home
- hide → artworks.status
- title/subtitle/description + MDX body → artworks_translations.title/subtitle/description/body
- seo.description/seo.keywords/seo.image → artworks_translations.seo_description/seo_keywords + artworks.seo_image
- image.main/image.otherImages → artworks.main_image/artworks.other_images via artworks_files
- sizes[].cm.height/width + array index → artwork_dimensions.height_cm/width_cm/sort linked by artworks_id
- sizes[].cm.depth or sizes[].cm.breadth → artwork_dimensions.depth_cm
- classification.serie → artworks.primary_serie
- quote.text → artworks_translations.quote_text
- quote.author → artworks.quote_author and artworks_translations.quote_author
- classification.technique/style/composition/surface → technique/styles/composition/surface relations and vocabulary collections
- classification.tags/tags → artworks.tags via artworks_tags and tags(_translations)
- reference/order/date → series.reference/sort/date
- title/subtitle/description + body → series_translations.title/subtitle/description/body
- image.main + seo.image → series.main_image/seo_image
- hide → series.status
- reference → pages.reference
- hide → pages.status
- body → pages_translations.body
- seo.* → pages_translations.seo_* + pages.seo_image
- about.paragraphs[].title → biography_events_translations.year_label
- about.paragraphs[].subtitle/text → biography_events_translations.title/description
- most precise available legacy date or year_label → biography_events.reference_date
- reference_date → biography_events.reference
- press.paragraphs[].date → press_articles.reference_date
- press.paragraphs[].title/text → press_articles_translations.title/description
- press.paragraphs[].author/link → press_articles.author/external_url
- complete reference_date → press_articles.reference

## Manual decisions required



- **press_articles: no explicit source → press_articles.media** — required field has no approved legacy mapping; do not infer it from author or domain

## Explicitly excluded

- **series `filosofes`: `quote.authorTitle`** — exclude from migration. It was legacy metadata not rendered by the series page, and Directus has no semantically equivalent field; do not change the schema or fold it into another quote field.
- **artworks: `lastModificationDate`** — exclude from migration. `date_created` and `date_updated` are Directus-managed audit fields; do not recreate legacy timestamps artificially.
- **artworks: `pageName`** — exclude from migration. Gatsby derives it from the canonical `reference`.
- **artworks: `url`** — exclude from migration. Gatsby builds it deterministically from `reference` and language.
- **artworks: `classification.orientation` storage** — exclude from Directus storage and derive in Gatsby from ordered dimensions using the legacy algorithm.
- **artwork `mediterranean-mother`: `quote-0` and `quote-2`** — exclude from migration. Gatsby never read, typed or rendered these unused legacy alternatives; preserve only canonical `quote`.

- **artworks: none** — ignore during migration; fields are temporary preservation fields and will be removed manually after transfer
- **exhibitions: content/pageTexts/exhibitions/** and exhibition-like prose** — do not import placeholder data; future exhibition content will be authored directly in Directus
- **blog: content/blog/**** — exclude completely; do not create a collection or import any blog data

## Relations to resolve during a future importer

- Apply the append-only reference check before uploading files or creating translations, dimensions and relations.
- For new records only, upload source images and retain a deterministic source-path → Directus file ID map.
- Resolve the one legacy `classification.serie` as `artworks.primary_serie`; leave `artworks.alternative_series` empty.
- Preserve ordering in `artwork_dimensions`, `artworks_files` and other ordered relation collections.
- Use the exact mapping in `vocabulary-map-proposal.md`. Before creating a vocabulary item, look up its exact reference; if it exists, do not create or update it and reuse its ID for the artwork relation. Never fuzzy-match.
- Verified existing references to reuse: techniques `acrylic`, `watercolor`; styles `scratch`, `figurative`; surface `paper`; compositions `single`, `triptych`. Missing references to create for migrated content: styles `abstract`, `textures`; surface `wood`.
- Never infer SEO keywords as public tags.
- Do not create exhibition records from Gatsby prose or placeholders.

## Dimensions

- `sizes[]` is the Gatsby origin for `artworks.dimensions` and `artwork_dimensions`.
- Create one `artwork_dimensions` row for every `sizes[]` element and preserve array order in `sort`.
- Map `cm.height → height_cm` and `cm.width → width_cm`.
- For `depth_cm`, prefer `cm.depth`; otherwise use legacy `cm.breadth`, which is confirmed as the third dimension/depth.
- If neither depth source exists, omit `depth_cm` so Directus applies its schema default.
- Exclude temporary scalar `artworks.height_cm`, `artworks.width_cm` and `artworks.depth_cm`. Remove them manually from the schema only after transferred dimensions have been validated.

## Potential information loss

- Multiple panels are preserved as multiple ordered `artwork_dimensions` rows.
- Unconvertible JSX/MDX is an incident requiring review, never content to discard silently.
- Legacy `pageName`, `url` and `lastModificationDate` are explicitly excluded according to the decisions above.
- Legacy fields beginning with an underscore (for example `_subtitle`) have no explicit Directus destination.
- Blog and exhibition placeholder content are intentionally excluded.
- Page `paragraphs` structures do not belong to `pages_translations`; only the about and press lists have probable dedicated destinations.

## New Directus capabilities absent from Gatsby

- Alternative series and richer exhibition ↔ artwork/series relations.
- Multiple files for biography events, exhibitions and press articles.
- Press tags and explicit press/exhibition relationships.
- Separate image alt text and wall-label fields.
- Workflow status, audit fields, sale visibility and sold-to information.
- Structured exhibition venue, city, type and start/end dates.
- Multiple ordered dimension rows through `artwork_dimensions`.

## Required fields with no apparent source or unresolved policy

- `biography_events.status`: No legacy origin; omit from payload so the Directus schema default applies
- `biography_events.reference`: No direct Gatsby source identified
- `press_articles.status`: No legacy origin; omit from payload so the Directus schema default applies
- `press_tags.tag`: No direct Gatsby source identified
- `press_tags_translations.name`: No direct Gatsby source identified
- `tags.tag`: No direct Gatsby source identified
- `tags_translations.name`: No direct Gatsby source identified

## Pages migration checkpoint

| Legacy field | Directus destination | Decision |
|---|---|---|
| reference | pages.reference | implemented; exact append-only lookup |
| hide | pages.status | implemented; true → archived, false/absent → published |
| title | pages_translations.title (ca) | implemented when present; optional in the current schema |
| subtitle | pages_translations.subtitle (ca) | implemented when present |
| MDX body | pages_translations.body (ca) | implemented; compatible Markdown/MDX → HTML |
| seo.description | pages_translations.seo_description (ca) | implemented |
| seo.keywords | pages_translations.seo_keywords (ca) | implemented |
| seo.image | pages.seo_image | implemented with SHA-256 file-map; current schema folder is null, so no folder is invented |
| pageName | none | derived from reference in Gatsby |
| url | none | derived from reference and language in Gatsby |
| lastModificationDate | none | excluded; Directus owns audit timestamps |
| about.paragraphs[] | future biography_events migration | excluded from pages; do not copy into body |
| press.paragraphs[] | future press_articles migration | excluded from pages; do not copy into body |
| reviews and reviews.paragraphs[] | none | EXCLUDED; do not create the page, upload reviews.jpg, import SEO or create placeholders |
| exhibitions legacy page and paragraphs | none | EXCLUDED; explicitly excluded from legacy migration |
| sortParagraphs | none in pages | excluded from page payload; it belongs to the separately migrated paragraph lists |
### Final pages scope

- about: migrable conceptually; existing Directus reference means complete SKIP.
- press: migrable conceptually; existing Directus reference means complete SKIP.
- reviews: EXCLUDED completely, including paragraphs, reviews.jpg and SEO.
- exhibitions: EXCLUDED from the legacy migration.
- PENDING: 0. Final categories are IMPLEMENTED, DERIVED and EXCLUDED.
