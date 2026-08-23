# Proposta de mapping de vocabularis

Anàlisi local dels valors legacy presents als artworks. No s'ha consultat Directus.

`migration/directus-schema.json` i el snapshot original només contenen l'esquema. Les existències indicades a continuació s'han verificat posteriorment amb peticions REST GET de només lectura a Directus.

Regla definitiva: abans de crear un item de vocabulari, cercar-ne la reference exacta. Si ja existeix, no crear-lo ni modificar-lo; reutilitzar-ne l'ID per crear la relació amb l'artwork. No fer fuzzy matching.

## Technique

Destí: `artwork_tecniques` mitjançant la relació M2M `artworks.technique`.

| Valor legacy exacte | Aparicions | Artworks de mostra | Descomposició proposada | Destination collection | Destination reference proposada | Confidence | Observacions |
|---|---:|---|---|---|---|---|---|
| `Acrylic` | 32 | `cor`, `el-comencament`, `estrella` | `Acrylic` | `artwork_tecniques` | `acrylic` | high | Ja existeix (ID 2): SKIP create/update i reutilitzar ID. |
| `Acrylic.withWaterColor` | 9 | `cats-essence`, `linked`, `cecilia-payne-gaposchkin` | `Acrylic` + `WaterColor` | `artwork_tecniques` (2 relacions M2M) | `acrylic` + `watercolor` | high | Ja existeixen (`acrylic` ID 2, `watercolor` ID 3): SKIP create/update i crear només les relacions. |

## Styles

Destí: `artwork_styles` mitjançant la relació M2M `artworks.styles`.

| Valor legacy exacte | Aparicions | Artworks de mostra | Descomposició proposada | Destination collection | Destination reference proposada | Confidence | Observacions |
|---|---:|---|---|---|---|---|---|
| `Scratch` | 17 | `cats-essence`, `cor`, `el-comencament` | `Scratch` | `artwork_styles` | `scratch` | high | Ja existeix (ID 2): SKIP create/update i reutilitzar ID. |
| `Undefined` | 1 | `follow-the-sun` | absència d'estil | `artwork_styles` | cap | high | Decisió definitiva: no crear `undefined` i no crear cap relació d'estil per aquest valor. |
| `Abstract` | 2 | `iraia`, `mediterranean-mother` | `Abstract` | `artwork_styles` | `abstract` | high | No existeix actualment: crear-lo en la futura migració. |
| `Scratch.withFigurative` | 7 | `angela-davis`, `audre-lorde`, `charlotte-perkins-gilman` | `Scratch` + `Figurative` | `artwork_styles` (2 relacions M2M) | `scratch` + `figurative` | high | Ja existeixen (`scratch` ID 2, `figurative` ID 3): SKIP create/update i reutilitzar IDs. |
| `Scratch.andFigurative` | 7 | `cecilia-payne-gaposchkin`, `georgia-okeeffe`, `herstory-moon` | `Scratch` + `Figurative` | `artwork_styles` (2 relacions M2M) | `scratch` + `figurative` | high | Ja existeixen (`scratch` ID 2, `figurative` ID 3): SKIP create/update i reutilitzar IDs. |
| `Textures` | 7 | `angela-davis-2`, `cel`, `yellow-butterfly` | `Textures` | `artwork_styles` | `textures` | high | Estil real; no existeix actualment i s'haurà de crear. |

## Surface

Destí: `artwork_surfaces` mitjançant la relació M2M `artworks.surface`.

| Valor legacy exacte | Aparicions | Artworks de mostra | Descomposició proposada | Destination collection | Destination reference proposada | Confidence | Observacions |
|---|---:|---|---|---|---|---|---|
| `Paper` | 1 | `huraca` | `Paper` | `artwork_surfaces` | `paper` | high | Ja existeix (ID 2): SKIP create/update i reutilitzar ID. |
| `wood` | 4 | `colorful-triphtyc`, `triphtyc-albert`, `triphtyc-mariona` | `wood` | `artwork_surfaces` | `wood` | high | No existeix actualment: crear-lo en la futura migració. |

## Composition

Destí: `artwork_composition` mitjançant la relació M2O `artworks.composition`.

| Valor legacy exacte | Aparicions | Artworks de mostra | Descomposició proposada | Destination collection | Destination reference proposada | Confidence | Observacions |
|---|---:|---|---|---|---|---|---|
| `Triptych` | 6 | `cats-essence`, `follow-the-sun`, `colorful-triphtyc` | `Triptych` | `artwork_composition` | `triptych` | high | Ja existeix (ID 2): SKIP create/update i reutilitzar ID. |
| `Single` | 35 | `cor`, `el-comencament`, `estrella` | `Single` | `artwork_composition` | `single` | high | Ja existeix (ID 1): SKIP create/update i reutilitzar ID. |

## Tags

Destí: `tags` mitjançant la relació M2M `artworks.tags`.

| Valor legacy exacte | Aparicions | Artworks de mostra | Descomposició proposada | Destination collection | Destination reference proposada | Confidence | Observacions |
|---|---:|---|---|---|---|---|---|
| — | 0 | — | — | `tags` | — | high | `classification.tags` apareix en 2 artworks però sempre com `[]`; no existeix cap camp superior `tags` amb valors. No s'ha de crear cap tag. |

## Mappings dubtosos

- No queda cap descomposició legacy pendent.
- Cap descomposició o reference legacy queda pendent. El futur importer haurà de repetir la comprovació exacta perquè l'estat de Directus pot canviar.

## Items Directus existents sense ús legacy

- `artwork_tecniques`: `chinese-ink`, `gouache`, `pencil`.
- `artwork_surfaces`: `canvas`.
- `artwork_composition`: `diptych`.
- `tags`: cap item.

Aquests items s'han de deixar intactes.

## Press media proposal

| Hostname | Articles | Author(s) observats | Media proposat | Confidence |
|---|---:|---|---|---|
| `art.beopenfuture.com` | 1 | BEOPEN art | `BEOPEN art` | high |
| `ccma.cat` | 1 | 3Cat | `3Cat` | high |
| `elvallenc.cat` | 15 | El Vallenc | `El Vallenc` | high |
| `lamarina.cat` | 1 | La Marina | `La Marina` | high |
| `diaridetarragona.com` | 1 | Diari de Tarragona | `Diari de Tarragona` | high |
| `tac12.tv` | 1 | TAC12 | `TAC12` | high |
| `infocamp.cat` | 2 | Infocamp | `Infocamp` | high |
| `femturisme.cat` | 2 | FemTurisme.cat | `FemTurisme.cat` | high |
| `ajuntament.barcelona.cat` | 1 | Centre Cívic Casa del Rellotge | `Ajuntament de Barcelona` | medium |
| `valls.radiociutat.com` | 2 | Valls Ràdio Ciutat | `Valls Ràdio Ciutat` | high |
| `modernetdigital.cat` | 2 | Modernet digital; Modernet Digital | `Modernet Digital` | high |
| `obertament.org` | 1 | Obertament | `Obertament` | high |

La proposta de media es basa en hostname i autoria observada. No modifica les dades i s'haurà d'aplicar mitjançant una taula explícita, mai amb fuzzy matching.
