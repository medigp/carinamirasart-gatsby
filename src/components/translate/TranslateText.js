import React from "react"
import { Translation, defaultLanguage } from "../../data/resources/translations";

const defaultLang = 'generic'
const getTranslation = (text, definedLang = defaultLang) => {
    let txt = ''
    let id = text || ''
    
    let lang = defaultLang
    if(definedLang !== undefined && definedLang !== '')
        lang = definedLang

    if(id && typeof id === 'string' && id !== undefined && id !== ''){
        id = id.toLowerCase().trim()
        if(Translation[ id ] !== undefined){
            if(Translation[ id ][ lang ] !== undefined){
                txt = Translation[ id ][ lang ]
            }else if(Translation[ id ][ defaultLanguage ] !== undefined){
                txt = Translation[ id ][ defaultLanguage ]
            }
        }
    }

    if(txt === '')
        txt = text
    return txt
}

export const getExistsTranslation = (text, definedLang = defaultLang) => {
    if(text === '' || text === undefined || typeof text !== 'string')
        return false

    let lang = defaultLang
    if(definedLang !== undefined && definedLang !== '')
        lang = definedLang
    
    let id = text.toLowerCase().trim();
    if(Translation[ id ] !== undefined && Translation[ id ][ lang ] !== undefined)
        return Translation[ id ][ lang ] !== ''
    return false
}

const hasSomeUpperCase = (string) => {
    return !isLowerCase(string)
}

const isLowerCase = (string) => {
    if(!string || string === undefined || string === '')
        return false;
    return (string === string.toLowerCase())
}

export const getTranslatedText = (text, selectedLang, dataToReplace = [], translateDataToReplace=false, forceLowerCase = false, avoidTranslate = false) => {
    if(avoidTranslate)
        return text
    
    // Si el 'lang' està en blanc es prova una versió genèrica (per exemple, mostra tant € com $)
    let { lang } = {}
    if(selectedLang !== undefined)
        lang = selectedLang
    
    let txt = getTranslation(text, lang)
    if(txt !== undefined && txt !== '' && dataToReplace !== undefined && Array.isArray(dataToReplace) && dataToReplace.length > 0){
        for(let i = 0; i < dataToReplace.length; i++){
            let elem = translateDataToReplace ? getTranslatedText(dataToReplace[i], lang) : dataToReplace[i]
            txt = txt.replaceAll('{'+ (i + 1) +'}', elem)
        }
    }

    if(txt !== undefined){
        if(forceLowerCase)
            txt = txt.toLowerCase();
        else if(hasSomeUpperCase(text))
            txt = txt.charAt(0).toUpperCase() + txt.slice(1);
        else if(isLowerCase(text))
            txt = txt.charAt(0).toLowerCase() + txt.slice(1);
    }
    return txt
}

const getTranslatedTextByProps = (props) => {
    const { text, dataToReplace = [], translateDataToReplace=false, forceLowerCase = false, avoidTranslate = false, lang } = props
    return getTranslatedText(text, lang, dataToReplace, translateDataToReplace, forceLowerCase, avoidTranslate)
}

export const TranslateText = (props) => {
    const txt = getTranslatedTextByProps(props)
    return (
        <span dangerouslySetInnerHTML={{__html:txt}}></span>
    )
}

export default TranslateText