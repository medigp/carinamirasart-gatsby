#!/bin/bash

# Aquest arxiu va a la mateixa carpeta que el projecte
# i ha de tenir permisos d’execució. 
# En cas de no tenir-ne, executar:
# "chmod +x deploy.sh"
# -> Si es vol executar des del Visual Studio Code, 
#     obrir un terminal del tipus bash (Git Bash, per exemple)
#       ./deploy.sh --env prod
# -> Per veure el progrés, mirar al fitxer de logs

# -----------------------------------------------------------
# -----------------------------------------------------------
# -----------------------------------------------------------
# ---- Inicialització de les variables
# -----------------------------------------------------------

source configuration.sh

CURRENT_DATE=$(date +%Y-%m-%d_%H:%M)
START_PROCESS_DATE=$SECONDS
ERROR="0"

if [[ -z ${PORT} ]] || [[ -z ${IP} ]] || [[ -z ${SERVER_PATH} ]]
then
  #aquí error perquè hi ha alguna cosa no definida!
  echo "ERROR DE CONFIGURACIÓ" >> "deploy_log.txt"
  echo "Les variables de connexió no estan definides" >> "deploy_log.txt"
  exit
fi

Help()
{
  echo "Arguments:"
  echo "  --env               Definir l'environment (producció, test, develop, admin...)"
  echo "  --no-build          Evita fer el build en local de gatsby"
  echo "  --no-clean          Evita fer el clean en local del codi"
  echo "  --no-clean-server   Evita fer el build de gatsby"
}

ENVIRONMENT="TEST"
SUBDOMAIN="test"
ARG_CLEAN="S"
ARG_CLEAN_SERVER="S"
ARG_BUILD="S"

VALID_ARGS=$(getopt -o h --long h,help,env:,subdomain:,no-local-clean,no-build,no-server-clean -- "$@")
if [[ ! -z $VALID_ARGS ]]
then
  eval set "$VALID_ARGS"
  i=1
  while [ "$i" -le "$#" ]; do
    eval "arg=\${$i}"
    if [ $arg != "--" ]
    then
    case "$arg" in
      --h | --help) Help  >> $LOGFILE; exit;;
      --env) eval "arg2=\${$((i+1))}";
            [ $arg2 != "" ] && ENVIRONMENT=$arg2
        ;;
      --subdomain) eval "arg2=\${$((i+1))}";
            [ $arg2 != "" ] && SUBDOMAIN=$arg2
        ;;
      --no-local-clean) ARG_CLEAN="N"
        ;;
      --no-server-clean) ARG_CLEAN_SERVER="N"
        ;;
      --no-build)  ARG_BUILD="N"
        ;;
    esac
    fi
    i=$((i + 1))
  done
fi

[ $ENVIRONMENT == "" ] && ENVIRONMENT="test"
ENVIRONMENT=${ENVIRONMENT^^} 
SUBDOMAIN=${ENVIRONMENT,,}
[ $SUBDOMAIN == "prod" ] && SUBDOMAIN=""

EXPECTED_TIME=0
if [ $ARG_CLEAN == "S" ]
then
  # Si NO s'ha definit el "no-clean", s'ha de fer el clean
  # Això implica fer el clean en local, fer el build i fer el clean al servidor
  CLEAN="S"
  CLEAN_SERVER="S"
  EXECUTE_BUILD="S"
else
  # Sinó... No fem el clean en local
  CLEAN="N"

  # Els altres segons els arguments
  if [ $ARG_BUILD == "N" ]
  then
    # Si s'ha definit el "no-build", NO es farà el build
    EXECUTE_BUILD="N"
  fi 

  if [ $ARG_CLEAN_SERVER == "N" ]
  then
    # Si s'ha definit el "no-clean-server", NO es farà el clean del server
    CLEAN_SERVER="N"
  fi 
fi

# Últimes execucions (en segons): 1739s

CLEAN_AVG_TIME=4                  # 5
BUILD_AVG_TIME=720                # 743   (12 minuts)
UPLOAD_AVG_TIME=1080              # 1107  (18 minuts)
CLEAN_SERVER_AVG_TIME=1           # 
FILES_TO_REAL_AVG_TIME=1          # 
DELETE_TEMP_FILES_AVG_TIME=2      # 4

#clean
[ $CLEAN == "S" ] && EXPECTED_TIME=$(( $EXPECTED_TIME + $CLEAN_AVG_TIME ))
#build
[ $EXECUTE_BUILD == "S" ] && EXPECTED_TIME=$(( $EXPECTED_TIME + $BUILD_AVG_TIME ))
#upload
EXPECTED_TIME=$(( $EXPECTED_TIME + $UPLOAD_AVG_TIME ))
#eliminar contingut del server
[ $CLEAN_SERVER == "S" ] && EXPECTED_TIME=$(( $EXPECTED_TIME + $CLEAN_SERVER_AVG_TIME ))

#desplegar contingut
EXPECTED_TIME=$(( $EXPECTED_TIME + $FILES_TO_REAL_AVG_TIME ))
#eliminar contingut de la carpeta temporal
EXPECTED_TIME=$(( $EXPECTED_TIME + $DELETE_TEMP_FILES_AVG_TIME ))

# Ajustem el path del server per si són subdominis
[ ! -z $SUBDOMAIN ] && SERVER_PATH="$SERVER_PATH/$SUBDOMAIN"

# Es genera l'expressió per excloure eliminacions
# Exclusions genèriques
PATH_EXCLUSIONS=(".temp" "maintenance")
FILE_EXCLUSIONS=(".htaccess" ".htaccess_disabled")

# Exclusions per configuració (subdominis definits a configuration.sh)
[ -n $DEFINED_SUBDOMAINS ] && PATH_EXCLUSIONS=(${PATH_EXCLUSIONS[@]} ${DEFINED_SUBDOMAINS[@]})

DELETE_EXCLUSIONS=""
ADD_A=""
if [ -n $PATH_EXCLUSIONS ]
then
  for elem in ${PATH_EXCLUSIONS[@]}
  do
    [ $ADD_A != "" ] && DELETE_EXCLUSIONS+=" -a "
    DELETE_EXCLUSIONS+="! -path '$SERVER_PATH/$elem*'"
    ADD_A="S"
  done
fi

if [ -n $FILE_EXCLUSIONS ]
then
  for elem in ${FILE_EXCLUSIONS[@]}
  do
    [ $ADD_A != "" ] && DELETE_EXCLUSIONS+=' -a '
    DELETE_EXCLUSIONS+="! -name '$elem'"
    ADD_A="S"
  done
fi

# -----------------------------------------------------------
# -----------------------------------------------------------
# -----------------------------------------------------------
# ---- Iniciar l’script
# -----------------------------------------------------------
echo "---------------------------------------------------------------"  >> $LOGFILE
echo "---- Execució del procés de deploy de CarinaMiras.art" >> $LOGFILE
echo "---- -> Desplegament a $ENVIRONMENT ($SERVER_PATH)" >> $LOGFILE
echo "---- -> Temps esperat aproximat: $EXPECTED_TIME segons" >> $LOGFILE
echo "---- -> Data de realització: $CURRENT_DATE" >> $LOGFILE
echo "---------------------------------------------------------------"  >> $LOGFILE

./telegram-send.sh "CarinaMirasArt ($ENVIRONMENT): Iniciant deploy..."

echo "- Inici del procés de deploy" >> $LOGFILE
if [ $CLEAN == "S" ]
then
  echo "- Inicialitzant el clean del projecte en local..." >> $LOGFILE
  ./telegram-send.sh "|--> CarinaMirasArt ($ENVIRONMENT): Executant clean de Gatsby..."
  
  CLEAN_START=$SECONDS
  gatsby clean
  CLEAN_ENDS=$SECONDS
  echo "|--> Clean executat amb èxit ($(($CLEAN_ENDS-$CLEAN_START)) segons)." >> $LOGFILE
else
  echo "- Procés definit sense l'execució del clean del projecte local" >> $LOGFILE
fi

# Executar build de Gatsby
if [ $EXECUTE_BUILD == "S" ]
then
  echo "- Executant build de Gatsby..." >> $LOGFILE
  ./telegram-send.sh "|--> CarinaMirasArt ($ENVIRONMENT): Executant build de Gatsby..."
  BUILD_START=$SECONDS
  gatsby build >> $LOGFILE
  if [ $? -eq 0 ]
  then
    echo "|--> Build executat amb èxit" >> $LOGFILE
    ERROR="0"
  else 
    echo "|--> Build executat SENSE èxit" >> $LOGFILE
    ./telegram-send.sh "|--> CarinaMirasArt ($ENVIRONMENT): Error al generar el build"
    ERROR="1"
  fi
  BUILD_ENDS=$SECONDS
else
  echo "|- Procés definit sense l'executació del build de Gatsby" >> $LOGFILE
fi

# Si s'ha executat el build correctament, comprovar si s’ha generat la carpeta
if [ $ERROR -eq "0" ]
then 
  if [ -d $LOCAL_PATH ] 
  then
    TEMPS_BUILD=$(($BUILD_ENDS-$BUILD_START))
    echo "|--> Carpeta del build generada amb èxit ($TEMPS_BUILD segons)." >> $LOGFILE
    ./telegram-send.sh "|--> CarinaMirasArt ($ENVIRONMENT): Build generat correctament ($TEMPS_BUILD segons)"
    ERROR="0"
  else
    echo "|--> ERROR: el build no s'ha realitzat correctament" >> $LOGFILE
    ./telegram-send.sh "|--> CarinaMirasArt ($ENVIRONMENT): ERROR al fer el build de Gatsby"
    ERROR="1"
  fi
fi

if [ $ERROR -eq "0" ]
then
  echo "- Crear la carpeta temporal al servidor" >> $LOGFILE
  ssh -p $PORT $USERNAME@$IP "mkdir $SERVER_PATH/$TEMP_FOLDER -p" >> $LOGFILE
  
  if [ $? -eq 0 ]
  then
    echo "|--> Carpeta temporal creada amb èxit" >> $LOGFILE
  else 
    echo "|--> ERROR: no s'ha pogut crear la carpeta temporal del servidor (Codi $?)" >> $LOGFILE
    ERROR="1"
  fi
fi

if [ $ERROR -eq "0" ]
then
  START_UPLOAD=$SECONDS
  echo "- Copiant arxius a la carpeta temporal del servidor..." >> $LOGFILE
  ./telegram-send.sh "|--> CarinaMirasArt ($ENVIRONMENT): Inici de la pujada de fitxers al servidor..."
  # Normalment tarda sobre els 600 segons
  scp -q -P $PORT -r $WINDOWS_PATH/$LOCAL_PATH/* $USERNAME@$IP:$SERVER_PATH/$TEMP_FOLDER >> $LOGFILE
  END_UPLOAD=$SECONDS

  if [ $? -eq 0 ]
  then
    TEMPS_UPLOAD=$(($END_UPLOAD-$START_UPLOAD))
    echo "|--> Pujada realitzada amb èxit ($TEMPS_UPLOAD segons)" >> $LOGFILE
    ./telegram-send.sh "|--> CarinaMirasArt ($ENVIRONMENT): Pujada realitzada correctament ($TEMPS_UPLOAD segons)"
  else 
    echo "|--> ERROR: no s'ha pogut pujar els arxius a la carpeta temporal del servidor (Codi $?)" >> $LOGFILE
    ./telegram-send.sh "|--> CarinaMirasArt ($ENVIRONMENT): ERROR al pujar els arxius al servidor"
    ERROR="1"
  fi
fi

# Conectar per SSH al servidor
if [ $ERROR -eq "0" ]
then
  echo "- Connectant al servidor via SSH..." >> $LOGFILE
  
  echo "---------------------------------------------------------------"  >> $LOGFILE
  ssh -T -p $PORT $USERNAME@$IP << EOF >> $LOGFILE
  if [ $? -eq 0 ]
  then
    echo "|--> La connexió s'ha realitzat correctament"
  else 
    echo "|--> ERROR: no s'ha pogut establir la connexió (Codi $?)"
    ERROR="1"
  fi
  
  if [ $ERROR == "0" ]
  then
    echo "- Activant mode manteniment..."
    mv $SERVER_PATH/.htaccess_disabled $SERVER_PATH/.htaccess
    if [ $? -eq 0 ]
    then 
      echo "|--> Mode manteniment: activat"
    else
      echo "|--> ERROR: no s'ha pogut activar el mode manteniment (Codi $?)"
      ERROR="1"
    fi
  fi

  shopt -s extglob
  if [ $ERROR == "0" ] && [ $CLEAN_SERVER == "S" ]
  then
    echo "- Eliminant contingut preexistent..."
    # Si s'han definit exclusions, s'executa del delete
    find $SERVER_PATH -mindepth 1 \( $DELETE_EXCLUSIONS \) -delete

    if [ $? -eq 0 ]
    then 
      echo "|--> Contingut eliminat correctament"
    else
      echo "|--> ERROR: no s'ha pogut eliminar el contingut (Codi $?)"
      ERROR="1"
    fi
  fi

  if [ $ERROR == "0" ]
  then
    echo "- Desplegant contingut..."
    mv -u $SERVER_PATH/$TEMP_FOLDER/* $SERVER_PATH/

    if [ $? -eq 0 ]
    then 
      echo "|--> Contingut desplegat correctament"
    else
      echo "|--> ERROR: no s'ha pogut desplegar el contingut (Codi $?)"
      ERROR="1"
    fi
  fi

  if [ $ERROR == "0" ]
  then
    echo "- Desactivant mode manteniment..."
    mv $SERVER_PATH/.htaccess $SERVER_PATH/.htaccess_disabled

    if [ $? -eq 0 ]
    then 
      echo "|--> Mode manteniment: desactivat"
    else
      echo "|--> ERROR: no s'ha pogut desactivar el mode manteniment (Codi $?)"
      ERROR="1"
    fi
  fi

  if [ $ERROR == "0" ]
  then
    echo "- Eliminant la carpeta temporal..."
    rm -rf $SERVER_PATH/$TEMP_FOLDER

    if [ $? -eq 0 ]
    then 
      echo "|--> Carpeta temporal eliminada correctament"
    else
      echo "|--> ERROR: no s'ha pogut desactivar eliminar la carpeta temporal (Codi $?)"
      ERROR="1"
    fi
  fi

  shopt -u extglob

  echo "- Tancant la connexió SSH..." 
EOF

fi

END_PROCESS_DATE=$SECONDS

echo "---------------------------------------------------------------"  >> $LOGFILE
if [ $ERROR -eq "0" ]
then
  TEMPS_TOTAL=$(($END_PROCESS_DATE-$START_PROCESS_DATE))
  MINUTS_TOTALS=$(($TEMPS_TOTAL / 60))
  SEGONS_TOTALS=$(($TEMPS_TOTAL - ($MINUTS_TOTALS * 60)))
  DECIMALS_MINUTS_TOTALS=$(( $SEGONS_TOTALS * 100 / 60  ))
  
  echo "---- El desplegament s’ha fet correctament en $MINUTS_TOTALS m ($TEMPS_TOTAL s)." >> $LOGFILE
  PREFIX="www"
  if [ $ENVIRONMENT == "TEST" ]
  then
    PREFIX="test"
  fi
  ./telegram-send.sh "CarinaMirasArt ($ENVIRONMENT): Deploy fet correctament en $MINUTS_TOTALS minuts! Ves a https://$PREFIX.carinamiras.art/"
else
  echo "---- S’han produït errors en el desplegament" >> $LOGFILE
  ./telegram-send.sh "CarinaMirasArt ($ENVIRONMENT): ERROR, desplagament incorrecte"
fi


echo "---------------------------------------------------------------"  >> $LOGFILE
echo "---- Finalització del procés de deploy de CarinaMiras.art" >> $LOGFILE
echo "---------------------------------------------------------------"  >> $LOGFILE
echo "" >> $LOGFILE
echo "" >> $LOGFILE