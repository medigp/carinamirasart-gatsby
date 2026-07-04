#!/bin/bash

# Deploy de CarinaMiras.art a Cloudflare Pages
# Aquest arxiu substitueix el flux antic basat en FTP/SSH/Hostinger.
#
# Ús habitual:
#   ./deploy.sh --env prod
#   ./deploy.sh --env test
#   ./deploy.sh --env prod --no-local-clean
#   ./deploy.sh --env prod --no-build
#
# Ús test:
#   pujant el que hi ha compilat:
#     ./deploy.sh --env test --no-build --no-local-clean
#   fent tot el procés:
#     ./deploy.sh --env test
#
# Requisits:
#   - Node/npm instal·lats (node v22)
#       - Si no funciona, des de PowerShell definim que es faci servir node 22: "nvm use 22.12.0"
#   - Wrangler autenticat prèviament: npx.cmd wrangler login
#   - Projecte de Cloudflare Pages existent: carinamiras-art
#   - La carpeta generada pel build ha d'existir, normalment: public

set -Eeuo pipefail

# -----------------------------------------------------------
# Configuració base
# -----------------------------------------------------------

# Manté compatibilitat amb el teu sistema actual de configuració.
# Ja no necessitem PORT, IP, SERVER_PATH, TEMP_FOLDER, etc.
if [ -f "configuration.sh" ]; then
  # shellcheck disable=SC1091
  source configuration.sh
fi

if [ -n "${NODE_BIN_DIR:-}" ]; then
  export PATH="$NODE_BIN_DIR:$PATH"
fi

CURRENT_DATE=$(date +%Y-%m-%d_%H:%M)
START_PROCESS_DATE=$SECONDS

LOGFILE=${LOGFILE:-deploy_log.txt}
LOCAL_PATH=${LOCAL_PATH:-public}
CLOUDFLARE_PROJECT_NAME=${CLOUDFLARE_PROJECT_NAME:-carinamiras-art}
PRODUCTION_BRANCH=${PRODUCTION_BRANCH:-main}
MIN_FILES_TO_DEPLOY=${MIN_FILES_TO_DEPLOY:-50}
MAX_FILES_FREE_PLAN=${MAX_FILES_FREE_PLAN:-20000}
MAX_FILE_SIZE_MB=${MAX_FILE_SIZE_MB:-25}
MAX_NODE_MAJOR_FOR_GATSBY_BUILD=${MAX_NODE_MAJOR_FOR_GATSBY_BUILD:-22}

# Pots sobreescriure aquestes ordres a configuration.sh si vols:
#   GATSBY_CLEAN_CMD="npm run clean"
#   GATSBY_BUILD_CMD="npm run build"
GATSBY_CLEAN_CMD=${GATSBY_CLEAN_CMD:-"npm run clean"}
GATSBY_BUILD_CMD=${GATSBY_BUILD_CMD:-"npm run build"}

ENVIRONMENT="TEST"
ARG_CLEAN="S"
ARG_BUILD="S"
CUSTOM_BRANCH=""

# -----------------------------------------------------------
# Funcions auxiliars
# -----------------------------------------------------------

Help() {
  echo "Arguments:"
  echo "  --env <prod|test|develop>     Defineix l'entorn del deploy"
  echo "  --branch <branch>             Força una branch concreta de Cloudflare Pages"
  echo "  --build-dir <path>            Carpeta final a desplegar. Per defecte: public o LOCAL_PATH"
  echo "  --no-local-clean              Evita executar el clean local de Gatsby"
  echo "  --no-build                    Evita fer el build local de Gatsby"
  echo "  --no-server-clean             Acceptat per compatibilitat, però ja no fa res"
  echo "  -h, --help                    Mostra aquesta ajuda"
}

log() {
  echo "$1" | tee -a "$LOGFILE"
}

send_telegram() {
  if [ -x "./telegram-send.sh" ]; then
    ./telegram-send.sh "$1" >/dev/null 2>&1 || true
  fi
}

fail() {
  log "|--> ERROR: $1"
  send_telegram "[CarinaMirasArt] $ENVIRONMENT | ERROR | $1"
  exit 1
}

get_npx_command() {
  case "${OSTYPE:-}" in
    msys*|cygwin*|win32*) echo "npx.cmd" ;;
    *)
      if command -v npx.cmd >/dev/null 2>&1; then
        echo "npx.cmd"
      else
        echo "npx"
      fi
      ;;
  esac
}

check_wrangler() {
  log "- Comprovant Wrangler..."

  if ! command -v "$NPX_CMD" >/dev/null 2>&1; then
    fail "No s'ha trobat $NPX_CMD. Instal·la Node/npm o revisa la configuració local."
  fi

  if ! "$NPX_CMD" wrangler --version >> "$LOGFILE" 2>&1; then
    fail "Wrangler no està disponible. Instal·la'l amb: npm install --save-dev wrangler"
  fi

  if ! "$NPX_CMD" wrangler whoami >> "$LOGFILE" 2>&1; then
    fail "Wrangler no està autenticat. Executa: $NPX_CMD wrangler login"
  fi

  log "|--> Wrangler disponible i autenticat."
}

check_node_for_build() {
  [ "$ARG_BUILD" = "S" ] || return 0

  log "- Comprovant versió de Node per al build..."

  local node_version
  local node_major
  node_version=$(node -v 2>/dev/null || true)
  node_major=${node_version#v}
  node_major=${node_major%%.*}

  if [ -z "$node_version" ] || [ -z "$node_major" ]; then
    fail "No s'ha pogut detectar Node. Revisa la instal·lació abans de fer el build."
  fi

  log "|--> Node detectat: $node_version"

  if [ "$node_major" -gt "$MAX_NODE_MAJOR_FOR_GATSBY_BUILD" ]; then
    fail "Gatsby 5.7 no es compatible amb Node $node_version en aquest projecte. Usa Node 18, 20 o 22 per fer el build."
  fi
}

format_seconds() {
  local total=$1
  local minuts=$((total / 60))
  local segons=$((total - (minuts * 60)))
  echo "${minuts}m ${segons}s"
}

# -----------------------------------------------------------
# Arguments
# -----------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help)
      Help
      exit 0
      ;;
    --env)
      [ $# -lt 2 ] && fail "Falta valor per --env"
      ENVIRONMENT="$2"
      shift 2
      ;;
    --branch)
      [ $# -lt 2 ] && fail "Falta valor per --branch"
      CUSTOM_BRANCH="$2"
      shift 2
      ;;
    --build-dir)
      [ $# -lt 2 ] && fail "Falta valor per --build-dir"
      LOCAL_PATH="$2"
      shift 2
      ;;
    --no-local-clean|--no-clean)
      ARG_CLEAN="N"
      shift
      ;;
    --no-build)
      ARG_BUILD="N"
      shift
      ;;
    --no-server-clean)
      # Abans servia per no netejar Hostinger. Ara ja no cal.
      shift
      ;;
    *)
      fail "Argument desconegut: $1"
      ;;
  esac
done

ENVIRONMENT=${ENVIRONMENT^^}
ENVIRONMENT_LOWER=${ENVIRONMENT,,}

if [ -n "$CUSTOM_BRANCH" ]; then
  CLOUDFLARE_BRANCH="$CUSTOM_BRANCH"
elif [ "$ENVIRONMENT_LOWER" = "prod" ] || [ "$ENVIRONMENT_LOWER" = "production" ]; then
  CLOUDFLARE_BRANCH="$PRODUCTION_BRANCH"
else
  CLOUDFLARE_BRANCH="$ENVIRONMENT_LOWER"
fi

NPX_CMD=$(get_npx_command)

# -----------------------------------------------------------
# Inici del procés
# -----------------------------------------------------------

log "---------------------------------------------------------------"
log "---- Execució del deploy de CarinaMiras.art a Cloudflare Pages"
log "---- -> Entorn: $ENVIRONMENT"
log "---- -> Projecte Pages: $CLOUDFLARE_PROJECT_NAME"
log "---- -> Branch Pages: $CLOUDFLARE_BRANCH"
log "---- -> Carpeta a desplegar: $LOCAL_PATH"
log "---- -> Data de realització: $CURRENT_DATE"
log "---------------------------------------------------------------"

send_telegram "[CarinaMirasArt] $ENVIRONMENT | Iniciant deploy a Cloudflare Pages | Branch: $CLOUDFLARE_BRANCH"

# -----------------------------------------------------------
# Wrangler
# -----------------------------------------------------------

check_wrangler
check_node_for_build

# -----------------------------------------------------------
# Clean local
# -----------------------------------------------------------

if [ "$ARG_CLEAN" = "S" ]; then
  log "- Executant clean local..."
  send_telegram "[CarinaMirasArt] $ENVIRONMENT | Clean local de Gatsby en curs"

  CLEAN_START=$SECONDS
  if eval "$GATSBY_CLEAN_CMD" >> "$LOGFILE" 2>&1; then
    CLEAN_ENDS=$SECONDS
    log "|--> Clean executat amb èxit ($(format_seconds $((CLEAN_ENDS-CLEAN_START))))."
  else
    fail "No s'ha pogut executar el clean local"
  fi
else
  log "- Procés definit sense clean local"
fi

# -----------------------------------------------------------
# Build de Gatsby
# -----------------------------------------------------------

if [ "$ARG_BUILD" = "S" ]; then
  log "- Executant build de Gatsby..."
  send_telegram "[CarinaMirasArt] $ENVIRONMENT | Build de Gatsby en curs"

  BUILD_START=$SECONDS
  if eval "$GATSBY_BUILD_CMD" >> "$LOGFILE" 2>&1; then
    BUILD_ENDS=$SECONDS
    log "|--> Build executat amb èxit ($(format_seconds $((BUILD_ENDS-BUILD_START))))."
    send_telegram "[CarinaMirasArt] $ENVIRONMENT | Build completat | Temps: $(format_seconds $((BUILD_ENDS-BUILD_START)))"
  else
    fail "Error generant el build de Gatsby"
  fi
else
  log "- Procés definit sense build local"
fi

# -----------------------------------------------------------
# Validacions abans del deploy
# -----------------------------------------------------------

log "- Validant carpeta generada..."

[ -d "$LOCAL_PATH" ] || fail "No existeix la carpeta a desplegar: $LOCAL_PATH"

FILE_COUNT=$(find "$LOCAL_PATH" -type f | wc -l | tr -d ' ')
log "|--> Fitxers detectats a $LOCAL_PATH: $FILE_COUNT"

if [ "$FILE_COUNT" -lt "$MIN_FILES_TO_DEPLOY" ]; then
  fail "La carpeta $LOCAL_PATH sembla tenir massa pocs fitxers ($FILE_COUNT). Aturo el deploy per seguretat."
fi

if [ "$FILE_COUNT" -gt "$MAX_FILES_FREE_PLAN" ]; then
  fail "La carpeta té $FILE_COUNT fitxers. El límit habitual del pla Free de Pages és $MAX_FILES_FREE_PLAN fitxers."
fi

OVERSIZED_FILES=$(find "$LOCAL_PATH" -type f -size +${MAX_FILE_SIZE_MB}M | head -n 20 || true)
if [ -n "$OVERSIZED_FILES" ]; then
  log "|--> Fitxers de més de ${MAX_FILE_SIZE_MB}MB detectats:"
  log "$OVERSIZED_FILES"
  fail "Cloudflare Pages no accepta fitxers individuals de més de ${MAX_FILE_SIZE_MB}MB"
fi

# -----------------------------------------------------------
# Deploy a Cloudflare Pages
# -----------------------------------------------------------

log "- Desplegant a Cloudflare Pages amb Wrangler..."
send_telegram "[CarinaMirasArt] $ENVIRONMENT | Pujant fitxers a Cloudflare Pages | Projecte: $CLOUDFLARE_PROJECT_NAME"

DEPLOY_START=$SECONDS

WRANGLER_COMMAND=(
  "$NPX_CMD" wrangler pages deploy "$LOCAL_PATH"
  --project-name "$CLOUDFLARE_PROJECT_NAME"
  --branch "$CLOUDFLARE_BRANCH"
  --commit-message "Deploy $ENVIRONMENT $CURRENT_DATE"
)

log "|--> Ordre: ${WRANGLER_COMMAND[*]}"

if "${WRANGLER_COMMAND[@]}" 2>&1 | tee -a "$LOGFILE"; then
  DEPLOY_END=$SECONDS
  log "|--> Deploy a Cloudflare Pages executat amb èxit ($(format_seconds $((DEPLOY_END-DEPLOY_START))))."
else
  fail "Wrangler no ha pogut completar el deploy"
fi

# -----------------------------------------------------------
# Finalització
# -----------------------------------------------------------

END_PROCESS_DATE=$SECONDS
TEMPS_TOTAL=$((END_PROCESS_DATE-START_PROCESS_DATE))

if [ "$CLOUDFLARE_BRANCH" = "$PRODUCTION_BRANCH" ]; then
  FINAL_URL="https://www.carinamiras.art/"
elif [ "$CLOUDFLARE_BRANCH" = "test" ]; then
  FINAL_URL="https://test.carinamiras-art.pages.dev/"
else
  FINAL_URL="Preview deployment de Cloudflare Pages. Revisa la URL exacta a la sortida de Wrangler o a Cloudflare → Deployments."
fi

log "---------------------------------------------------------------"
log "---- Deploy fet correctament en $(format_seconds "$TEMPS_TOTAL")."
log "---- URL: $FINAL_URL"
log "---------------------------------------------------------------"
log ""

send_telegram "[CarinaMirasArt] $ENVIRONMENT | Deploy completat | Temps: $(format_seconds "$TEMPS_TOTAL")"
send_telegram "[CarinaMirasArt] $ENVIRONMENT | Web desplegada correctament | $FINAL_URL"
