# carinamiras.art

Web estàtica de Carina Miras construïda amb Gatsby. El contingut es llegeix de Directus durant el build i el resultat de `public/` es publica a Cloudflare Pages.

## Requisits

- Node.js 22 i npm 10 o superior.
- Accés REST a Directus.
- Per desplegar: Wrangler i un token de Cloudflare Pages vàlid.
- Git Bash o un entorn compatible amb Bash per executar `deploy.sh` des de Windows.

Instal·lació:

```bash
npm install
```

## Entorns

La configuració local és en tres fitxers no versionats:

- `.env.development`: desenvolupament i servidor local.
- `.env.test`: build i deploy de preproducció.
- `.env.production`: build i deploy de producció.

No hi ha un `.env` comú. Les variables compartides es dupliquen expressament als tres fitxers; si en falta una, el procés ha de fallar.

Variables principals de Gatsby i Directus:

```dotenv
GATSBY_MY_ENVIRONMENT=development
GATSBY_SITE_URL=http://localhost:9000
GATSBY_CONTENT_SOURCE=directus
DIRECTUS_LANGUAGES=ca
DIRECTUS_URL=https://directus.example.com
DIRECTUS_TOKEN=...
DIRECTUS_BASIC_AUTH_USER=...
DIRECTUS_BASIC_AUTH_PASSWORD=...
```

Per test i producció cal definir també, com a mínim:

```dotenv
LOCAL_PATH=public
LOGFILE=deploy_log.txt
CLOUDFLARE_PROJECT_NAME=carinamiras-art
PRODUCTION_BRANCH=main
MIN_FILES_TO_DEPLOY=50
MAX_FILES_FREE_PLAN=20000
MAX_FILE_SIZE_MB=25
GATSBY_CLEAN_CMD="npm run clean"
GATSBY_BUILD_CMD="npm run build"
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

Les notificacions de Telegram són opcionals:

```dotenv
TELEGRAM_CHAT_ID=...
TELEGRAM_BOT_TOKEN_ID=...
```

No s’han de versionar mai els `.env`, tokens, contrasenyes ni claus. Quan s’afegeix una variable necessària, cal afegir-la als tres fitxers.

## Permisos del token de Directus

El token utilitzat pel build necessita lectura de les col·leccions publicades i de totes les relacions consultades. Per a la classificació de les obres ha de poder llegir:

- `artworks` i `artworks_translations`;
- `artwork_tecniques` i `artwork_tecniques_translations`;
- `artwork_styles` i `artwork_styles_translations`;
- `artwork_surfaces` i `artwork_surfaces_translations`;
- `artwork_composition` i `artwork_composition_translations`;
- les taules intermèdies `artworks_artwork_tecniques`, `artworks_artwork_styles` i `artworks_artwork_surfaces`.

Si aquests permisos falten, Directus pot retornar l’obra però ometre silenciosament els camps relacionals.

## Desenvolupament local

```bash
npm run develop
```

Gatsby utilitza `.env.development` i serveix la web habitualment a `http://localhost:8000/`.

## Build i previsualització local

Un build estàtic normal de Gatsby s’executa en mode `production`; per tant, si no s’han exportat variables abans, Gatsby carrega `.env.production`.

Per provar explícitament amb les dades de desenvolupament des de Git Bash:

```bash
set -a
source .env.development
set +a
npm run clean
npm run build
npm run serve -- --host 127.0.0.1 --port 9000
```

La previsualització queda a `http://127.0.0.1:9000/`. Això només genera i serveix fitxers locals: no executa Wrangler ni publica res.

## Deploy de test

El deploy de test carrega `.env.test`, construeix la web i publica la branca `test` de Cloudflare Pages:

```bash
./deploy.sh --env test
```

URL estable de preproducció:

```text
https://test.carinamiras-art.pages.dev/
```

També es pot executar amb:

```bash
npm run deploy_to_server:test
```

## Deploy de producció

Producció utilitza `.env.production` i la branca `main`:

```bash
./deploy.sh --env prod
```

o:

```bash
npm run deploy_to_server:prod
```

Aquest pas publica `carinamiras.art`. No s’ha d’executar sense confirmació explícita.

## Què valida `deploy.sh`

Abans de publicar, l’script comprova:

- variables obligatòries de l’entorn;
- versions de Node i Wrangler;
- autenticació de Wrangler;
- resultat del clean i del build;
- existència i nombre de fitxers de `public/`;
- límit de 20.000 fitxers;
- absència de fitxers de més de 25 MB.

Els errors es mostren al terminal, s’escriuen a `deploy_log.txt` i, si hi ha credencials de Telegram, també es notifiquen pel bot.

## Notes de seguretat

- No utilitzar FTP, SSH, SCP ni el deploy antic d’Hostinger en el flux normal.
- No executar `deploy-hostinger.sh` sense una instrucció explícita.
- No pujar mai `configuration.sh`; ja no forma part del flux normal.
- Un build local o `gatsby serve` no és un deploy.
