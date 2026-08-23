#!/bin/bash
# https://hackernoon.com/how-to-create-a-simple-bash-shell-script-to-send-messages-on-telegram-lcz31bx
# https://www.youtube.com/watch?v=CVG_ejMjNfU&ab_channel=WatchNLearnIT
#
# Quan el crida deploy.sh, aquestes variables venen del .env de l'entorn.
# Per executar aquest script sol, cal exportar-les abans.
: "${TELEGRAM_BOT_TOKEN_ID:?Falta TELEGRAM_BOT_TOKEN_ID}"
: "${TELEGRAM_CHAT_ID:?Falta TELEGRAM_CHAT_ID}"

if [ "$1" == "-h" ]; then
  echo "Usage: `basename $0` \"text message\""
  exit 0
fi

if [ -z "$1" ]
  then
    echo "Add message text as second arguments"
    exit 0
fi

if [ "$#" -ne 1 ]; then
    echo "You can pass only one argument. For string with spaces put it on quotes"
    exit 0
fi

MESSAGE=$1

URL='https://api.telegram.org/bot'$TELEGRAM_BOT_TOKEN_ID'/sendMessage'
curl -s -X POST $URL -d chat_id=$TELEGRAM_CHAT_ID -d text="$MESSAGE"
