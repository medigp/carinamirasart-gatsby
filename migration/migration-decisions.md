# Decisions review before MIGRATION_SPEC

Generated locally by `node migration/analyse-decisions.mjs`. No HTTP requests were made. No source content or Directus schema was modified.

## Confirmed constraints

- One legacy series only: `classification.serie → artworks.primary_serie`.
- `artworks.alternative_series` remains empty during migration.
- `quote.author` populates both base and Catalan translation author fields.
- Existing Catalan values use `languages_code=ca`; no Spanish or English text is generated.
- Exhibitions are excluded entirely; placeholder Gatsby data is not migrated.
- Temporary scalar `artworks.height_cm/width_cm/depth_cm` fields are ignored; only `artwork_dimensions` is populated.

## 1. STATUS / HIDE

### artworks

- Total: **41**
- With `hide`: **7**
- Values: false, true
- `hide=true`: **6**
- content/paints/miscellany/angela-davis-2/paint.mdx
- content/paints/miscellany/papallona-groga/paint.mdx
- content/paints/miscellany/papallona-monarca/paint.mdx
- content/paints/miscellany/papallona-verda/paint.mdx
- content/paints/miscellany/papallona-vermella/paint.mdx
- content/paints/miscellany/raven/paint.mdx
- `hide=false`: **1**
- content/paints/comission/cats-essence/paint.mdx
- Missing `hide`: **34**
- content/paints/comission/cor/paint.mdx
- content/paints/comission/el-comencament/paint.mdx
- content/paints/comission/estrella/paint.mdx
- content/paints/comission/follow-the-sun/paint.mdx
- content/paints/comission/Iraia/paint.mdx
- content/paints/comission/linked/paint.mdx
- content/paints/comission/llum-groga/paint.mdx
- content/paints/comission/lluna/paint.mdx
- content/paints/comission/mediterranean-mother/paint.mdx
- content/paints/comission/the-life-of-the-river/paint.mdx
- content/paints/filosofes/angela-davis/paint.mdx
- content/paints/filosofes/audre-lorde/paint.mdx
- content/paints/filosofes/charlotte-perkins-gilman/paint.mdx
- content/paints/filosofes/jane-addams/paint.mdx
- content/paints/filosofes/judith-shklar/paint.mdx
- content/paints/filosofes/nuria-sara-miras/paint.mdx
- content/paints/filosofes/vandana-shiva/paint.mdx
- content/paints/herstory/cecilia-payne-gaposchkin/paint.mdx
- content/paints/herstory/georgia-okeeffe/paint.mdx
- content/paints/herstory/herstory-moon/paint.mdx
- content/paints/herstory/junko-tabei/paint.mdx
- content/paints/herstory/maria-sibylla-merian/paint.mdx
- content/paints/herstory/mary-lawrance/paint.mdx
- content/paints/herstory/val-plumwood/paint.mdx
- content/paints/miscellany/blue-butterfly/paint.mdx
- content/paints/miscellany/cel/paint.mdx
- content/paints/miscellany/huraca/paint.mdx
- content/paints/miscellany/huraca-2/paint.mdx
- content/paints/miscellany/mental-health/paint.mdx
- content/paints/miscellany/nuvol/paint.mdx
- content/paints/wood/colorful-tripthyc/paint.mdx
- content/paints/wood/triptic-albert/paint.mdx
- content/paints/wood/triptic-mariona/paint.mdx
- content/paints/wood/yellow-tryphtic/paint.mdx
- Other values: **0**
- None

### series

- Total: **5**
- With `hide`: **5**
- Values: false
- `hide=true`: **0**
- None
- `hide=false`: **5**
- content/series/comission/serie.mdx
- content/series/filosofes/serie.mdx
- content/series/herstory/serie.mdx
- content/series/miscellany/serie.mdx
- content/series/wood/serie.mdx
- Missing `hide`: **0**
- None
- Other values: **0**
- None

### pages

- Total: **4**
- With `hide`: **0**
- Values: none
- `hide=true`: **0**
- None
- `hide=false`: **0**
- None
- Missing `hide`: **4**
- content/pageTexts/about/about.mdx
- content/pageTexts/exhibitions/exhibitions.mdx
- content/pageTexts/press/press.mdx
- content/pageTexts/reviews/reviews.mdx
- Other values: **0**
- None

### blog

- Total: **2**
- With `hide`: **0**
- Values: none
- `hide=true`: **0**
- None
- `hide=false`: **0**
- None
- Missing `hide`: **2**
- content/blog/00-hello-world.mdx
- content/blog/01-other-entrance.mdx
- Other values: **0**
- None

No final `hide → status` mapping is selected here.

## 2. DIMENSIONS DE LES OBRES

Directus now supports one ordered `artwork_dimensions` row per `sizes[]` element, so multi-panel values can be preserved without flattening. The temporary scalar `artworks.height_cm/width_cm/depth_cm` fields are explicitly ignored during migration and will be removed manually afterwards.

- One size element: **35**
- Multiple size elements: **6**
- Missing or empty sizes: **0**
- Incomplete or strange: **8** (includes legacy `breadth`, which is not silently treated as Directus `depth_cm`)
- content/paints/comission/Iraia/paint.mdx
- content/paints/comission/mediterranean-mother/paint.mdx
- content/paints/comission/the-life-of-the-river/paint.mdx
- content/paints/miscellany/huraca/paint.mdx
- content/paints/wood/colorful-tripthyc/paint.mdx
- content/paints/wood/triptic-albert/paint.mdx
- content/paints/wood/triptic-mariona/paint.mdx
- content/paints/wood/yellow-tryphtic/paint.mdx

| Structural format | Count | Example references |
|---|---:|---|
| [{cm:{breadth:number,height:number,width:number}}] | 8 | iraia, mediterranean-mother, the-life-of-the-river |
| [{cm:{height:number,width:number}}] | 33 | cats-essence, cor, el-comencament |

## Multi-size artworks

### cats-essence — L'escència de cada gat

Source: `content/paints/comission/cats-essence/paint.mdx`

```json
[
  {
    "cm": {
      "height": 40,
      "width": 40
    }
  },
  {
    "cm": {
      "height": 40,
      "width": 40
    }
  },
  {
    "cm": {
      "height": 40,
      "width": 40
    }
  }
]
```

### follow-the-sun — Follow the sun

Source: `content/paints/comission/follow-the-sun/paint.mdx`

```json
[
  {
    "cm": {
      "height": 50,
      "width": 40
    }
  },
  {
    "cm": {
      "height": 50,
      "width": 40
    }
  },
  {
    "cm": {
      "height": 50,
      "width": 40
    }
  }
]
```

### colorful-triphtyc — Tríptic de colors

Source: `content/paints/wood/colorful-tripthyc/paint.mdx`

```json
[
  {
    "cm": {
      "height": 110,
      "width": 9.5,
      "breadth": 6
    }
  },
  {
    "cm": {
      "height": 130,
      "width": 9.5,
      "breadth": 6
    }
  },
  {
    "cm": {
      "height": 80,
      "width": 9.5,
      "breadth": 6
    }
  }
]
```

### triphtyc-albert — Tríptic blaus i vermells

Source: `content/paints/wood/triptic-albert/paint.mdx`

```json
[
  {
    "cm": {
      "height": 110,
      "width": 9.5,
      "breadth": 6
    }
  },
  {
    "cm": {
      "height": 130,
      "width": 9.5,
      "breadth": 6
    }
  },
  {
    "cm": {
      "height": 80,
      "width": 9.5,
      "breadth": 6
    }
  }
]
```

### triphtyc-mariona — Tríptic blau

Source: `content/paints/wood/triptic-mariona/paint.mdx`

```json
[
  {
    "cm": {
      "height": 110,
      "width": 9.5,
      "breadth": 6
    }
  },
  {
    "cm": {
      "height": 130,
      "width": 9.5,
      "breadth": 6
    }
  },
  {
    "cm": {
      "height": 80,
      "width": 9.5,
      "breadth": 6
    }
  }
]
```

### yellow-triphtyc — Tríptic Groc

Source: `content/paints/wood/yellow-tryphtic/paint.mdx`

```json
[
  {
    "cm": {
      "height": 110,
      "width": 9.5,
      "breadth": 6
    }
  },
  {
    "cm": {
      "height": 130,
      "width": 9.5,
      "breadth": 6
    }
  },
  {
    "cm": {
      "height": 80,
      "width": 9.5,
      "breadth": 6
    }
  }
]
```

No total dimensions are calculated.

## 3. SERIES

The decided destination is `artworks.primary_serie`; `artworks.alternative_series` remains empty. No fuzzy matching is used.

### Legacy values and candidate mapping

| Legacy value | Count | Artwork examples | Candidate series reference | Confidence | Notes |
|---|---:|---|---|---|---|
| Comission | 12 | cats-essence, cor, el-comencament, estrella | comission | high | Exact match against series reference/title/serie |
| Filòsofes | 7 | angela-davis, audre-lorde, charlotte-perkins-gilman, jane-addams | filosofes | high | Exact match against series reference/title/serie |
| Herstory | 7 | cecilia-payne-gaposchkin, georgia-okeeffe, herstory-moon, junko-tabei | herstory | high | Exact match against series reference/title/serie |
| Miscellany | 11 | angela-davis-2, cel, huraca, huraca-2 | miscellany | high | Exact match against series reference/title/serie |
| Wood | 4 | colorful-triphtyc, triphtyc-albert, triphtyc-mariona, yellow-triphtyc | wood | high | Exact match against series reference/title/serie |

### Series definitions

| Reference | Title | Legacy serie field | Document |
|---|---|---|---|
| comission | Comission | Comission | content/series/comission/serie.mdx |
| filosofes | Filòsofes | Filòsofes | content/series/filosofes/serie.mdx |
| herstory | Herstory | Herstory | content/series/herstory/serie.mdx |
| miscellany | Miscellany | Miscellany | content/series/miscellany/serie.mdx |
| wood | Wood | Wood | content/series/wood/serie.mdx |

### Case-only variants

- None

## 4. VOCABULARIS TÈCNICS

### technique → artwork_tecniques

Schema collection exists: **yes**. The schema contains no vocabulary records, so destination values cannot be verified without forbidden HTTP access.

| Exact value | Count | Artwork examples | Compound | Proposed parts (not a decision) |
|---|---:|---|---:|---|
| Acrylic | 32 | cor, el-comencament, estrella, follow-the-sun |  |  |
| Acrylic.withWaterColor | 9 | cats-essence, linked, cecilia-payne-gaposchkin, georgia-okeeffe |  |  |

- Case-only variants: none
- Possible normalized duplicates: none

### style → artwork_styles

Schema collection exists: **yes**. The schema contains no vocabulary records, so destination values cannot be verified without forbidden HTTP access.

| Exact value | Count | Artwork examples | Compound | Proposed parts (not a decision) |
|---|---:|---|---:|---|
| Abstract | 2 | iraia, mediterranean-mother |  |  |
| Scratch | 17 | cats-essence, cor, el-comencament, estrella |  |  |
| Scratch.andFigurative | 7 | cecilia-payne-gaposchkin, georgia-okeeffe, herstory-moon, junko-tabei |  |  |
| Scratch.withFigurative | 7 | angela-davis, audre-lorde, charlotte-perkins-gilman, jane-addams |  |  |
| Textures | 7 | angela-davis-2, cel, yellow-butterfly, monarch-butterfly |  |  |
| Undefined | 1 | follow-the-sun |  |  |

- Case-only variants: none
- Possible normalized duplicates: none

### surface → artwork_surfaces

Schema collection exists: **yes**. The schema contains no vocabulary records, so destination values cannot be verified without forbidden HTTP access.

| Exact value | Count | Artwork examples | Compound | Proposed parts (not a decision) |
|---|---:|---|---:|---|
| Paper | 1 | huraca |  |  |
| wood | 4 | colorful-triphtyc, triphtyc-albert, triphtyc-mariona, yellow-triphtyc |  |  |

- Case-only variants: none
- Possible normalized duplicates: none

### composition → artwork_composition

Schema collection exists: **yes**. The schema contains no vocabulary records, so destination values cannot be verified without forbidden HTTP access.

| Exact value | Count | Artwork examples | Compound | Proposed parts (not a decision) |
|---|---:|---|---:|---|
| Single | 35 | cor, el-comencament, estrella, iraia |  |  |
| Triptych | 6 | cats-essence, follow-the-sun, colorful-triphtyc, triphtyc-albert |  |  |

- Case-only variants: none
- Possible normalized duplicates: none

### classification.tags → tags

Schema collection exists: **yes**. The schema contains no vocabulary records, so destination values cannot be verified without forbidden HTTP access.

| Exact value | Count | Artwork examples | Compound | Proposed parts (not a decision) |
|---|---:|---|---:|---|
| — | 0 | — | — | — |

- Case-only variants: none
- Possible normalized duplicates: none

### tags → tags

Schema collection exists: **yes**. The schema contains no vocabulary records, so destination values cannot be verified without forbidden HTTP access.

| Exact value | Count | Artwork examples | Compound | Proposed parts (not a decision) |
|---|---:|---|---:|---|
| — | 0 | — | — | — |

- Case-only variants: none
- Possible normalized duplicates: none

No values are merged or corrected automatically.

## 5. QUOTES

Decision already made: `quote.author` populates both `artworks.quote_author` and Catalan `artworks_translations.quote_author`; `quote.text` populates Catalan `artworks_translations.quote_text`. No values are translated.

- Total artworks: **41**
- Artworks with a `quote` field: **25**
- Text without author: **0**
- None
- Author without text: **0**
- None
- Empty quote structures: **0**
- None

### Structures

- `{author:string,text:string}`: 25

### Authors

| Exact author | Count | Artwork examples | Generic / potentially translatable |
|---|---:|---|---:|
| Abhijit Naskar | 1 | colorful-triphtyc |  |
| Angela Davis | 2 | angela-davis, angela-davis-2 |  |
| Audre Lorde | 1 | audre-lorde |  |
| Carina Miras | 1 | follow-the-sun |  |
| Charlotte Perkins Gilman | 1 | charlotte-perkins-gilman |  |
| Christy Ann Martine | 1 | mediterranean-mother |  |
| David Viscott | 1 | iraia |  |
| George Michael | 1 | cor |  |
| Jane Addams | 1 | jane-addams |  |
| Jim Bishop | 1 | el-comencament |  |
| John Keats | 1 | green-butterfly |  |
| Judith Shklar | 1 | judith-shklar |  |
| Louis Nizer | 1 | linked |  |
| Maya Angelou | 1 | red-butterfly |  |
| Núria Sara Miras Boronat | 1 | nuria-sara-miras |  |
| Oscar Wilde | 1 | raven |  |
| Rupi Kaur | 1 | monarch-butterfly |  |
| Stephany Meyer | 1 | estrella |  |
| Tahereh Mafi | 1 | lluna |  |
| Talismanist Giebra | 1 | huraca |  |
| The Beattles | 1 | mental-health |  |
| Vandana Shiva | 1 | vandana-shiva |  |
| Wendy Mass | 1 | yellow-butterfly |  |
| Zhuangzi | 1 | blue-butterfly |  |

Generic values found: none.

## 6. SELLING DATA

- Artworks with `sellingData`: **41** / 41
- `priceEur` present: **41**
- `showPrice` present: **41**
- Fields found: `priceEur`, `productState`, `showPrice`

| productState | Count | Examples |
|---|---:|---|
| ForSale | 7 | angela-davis-2, nuvol, yellow-butterfly, monarch-butterfly, green-butterfly |
| Sold | 34 | cats-essence, cor, el-comencament, estrella, follow-the-sun |

### Suspicious combinations

- Sold with public price: **0**
- None
- `showPrice=true` without `priceEur`: **0**
- None
- `priceEur` present but `showPrice` absent: **0**
- None
- Unknown product state: **0**
- None

## 7. BIOGRAPHY

- Total paragraphs: **34**
- Structural formats: **4**
  - `{_subtitle:string,image:string,subtitle:string,text:string,title:string}`: 3
  - `{image:string,subtitle:string,text:string,title:string}`: 23
  - `{subtitle:string,text:string,title:string}`: 5
  - `{text:string,title:string}`: 3
- Title values formatted as a single year: **34**
- Title values formatted as year intervals: **0**
- Missing subtitle: **3**
- content/pageTexts/about/about.mdx#paragraph-1
- content/pageTexts/about/about.mdx#paragraph-2
- content/pageTexts/about/about.mdx#paragraph-3
- Missing text: **0**
- None
- Non-empty image: **1**
- content/pageTexts/about/about.mdx#paragraph-12
- Not directly convertible without inventing required values: **3**
- content/pageTexts/about/about.mdx#paragraph-1
- content/pageTexts/about/about.mdx#paragraph-2
- content/pageTexts/about/about.mdx#paragraph-3

### Title values

| Exact title | Count | Format |
|---|---:|---|
| 1986 | 1 | year |
| 2001 | 1 | year |
| 2002 | 1 | year |
| 2004 | 1 | year |
| 2006 | 1 | year |
| 2008 | 1 | year |
| 2010 | 1 | year |
| 2013 | 2 | year |
| 2014 | 1 | year |
| 2015 | 2 | year |
| 2019 | 1 | year |
| 2020 | 1 | year |
| 2021 | 1 | year |
| 2022 | 2 | year |
| 2023 | 8 | year |
| 2024 | 5 | year |
| 2025 | 4 | year |

Directus requires `reference`, `reference_date`, Catalan `year_label`, and Catalan `title`. This report does not invent them.

## 8. PRESS

- Total articles: **30**

| Field | Present | Missing/empty |
|---|---:|---:|
| author | 30 | 0 |
| date | 30 | 0 |
| link | 30 | 0 |
| text | 21 | 9 |
| title | 30 | 0 |

- Missing date: **0**
- None
- Missing title: **0**
- None
- Missing author: **0**
- None
- Missing link: **0**
- None

### Date formats

- YYYY-M-D: 12
- YYYY-MM-DD: 18

### Domains and proposed media values

| Domain | Count | Existing authors | Proposed media | Status |
|---|---:|---|---|---|
| ajuntament.barcelona.cat | 1 | Centre Cívic Casa del Rellotge | Centre Cívic Casa del Rellotge | proposal only |
| art.beopenfuture.com | 1 | BEOPEN art | BEOPEN art | proposal only |
| ccma.cat | 1 | 3Cat | 3Cat | proposal only |
| diaridetarragona.com | 1 | Diari de Tarragona | Diari de Tarragona | proposal only |
| elvallenc.cat | 15 | El Vallenc | El Vallenc | proposal only |
| femturisme.cat | 2 | FemTurisme.cat | FemTurisme.cat | proposal only |
| infocamp.cat | 2 | Infocamp | Infocamp | proposal only |
| lamarina.cat | 1 | La Marina | La Marina | proposal only |
| modernetdigital.cat | 2 | Modernet digital, Modernet Digital | modernetdigital.cat | proposal only |
| obertament.org | 1 | Obertament | Obertament | proposal only |
| tac12.tv | 1 | TAC12 | TAC12 | proposal only |
| valls.radiociutat.com | 2 | Valls Ràdio Ciutat | Valls Ràdio Ciutat | proposal only |

### Duplicate risk

- Exact duplicate titles: **0**
  - None
- Slug collisions: **0**
  - None

## 9. IMATGES

- Artwork main images: **41** references, **41** resolved
- Artwork other images: **95** references, **92** resolved
- SEO images: **14** references, **14** resolved
- Series images: **5** references, **5** resolved
- Page images: **5** references, **5** resolved
- Missing file references: **3**
  - content/paints/comission/follow-the-sun/paint.mdx — `image.otherImages[1]` = `03.jpg. 04.jpg`
  - content/paints/comission/Iraia/paint.mdx — `image.otherImages[0]` = `02.jpg. 03.jpg`
  - content/paints/comission/Iraia/paint.mdx — `image.otherImages[1]` = `04.jpg. 05.jpg`
- Case-only path mismatches: **0**
  - None
- Same image reused by different content: **0**
  - None

No files are copied or moved.

## 10. BLOG

- Documents: **2**

| Document | Reference | Title | Frontmatter fields | Body | Images |
|---|---|---|---|---:|---:|
| content/blog/00-hello-world.mdx | — | Hello World | title, date | yes | 0 |
| content/blog/01-other-entrance.mdx | — | Other Entrance | title | yes | 0 |

Inventory only. No Directus collection is proposed.

## Decisions pendents abans de MIGRATION_SPEC

### CRÍTICA

- Define the exact `hide`/missing-hide → Directus `status` policy for artworks, series and pages.

- Decide whether the legacy `sizes[].cm.breadth` field means Directus `depth_cm`; no automatic equivalence is assumed.
- Decide how to generate stable, unique `biography_events.reference` and what `reference_date` means when the source only provides a year; also decide a required title policy for entries without subtitle.
- Correct or explicitly map the three malformed multi-image references before import; source files must not be guessed silently.

### IMPORTANT

- Approve exact normalization/splitting rules for compound technical vocabularies (for example `.with` and `.and`) and confirm destination vocabulary IDs later without fuzzy matching.
- Confirm each legacy series value → exact series reference mapping shown above; the relation policy itself is already decided.
- Define legacy `productState` → Directus `sale_status` and visibility/default policies for `show_sale_status` and missing price flags.
- Define stable `press_articles.reference`, approve domain/author → `media`, and choose dateTime/timezone normalization.

### MENOR

- Decide whether legacy folder/`pageName`/`url` mismatches are only historical aliases or must be retained before canonicalizing on `reference`.
- Decide whether legacy underscored fields such as `_subtitle` are discarded or retained manually.
- Decide whether blog documents are explicitly excluded from this migration; no new Directus collection is proposed here.
