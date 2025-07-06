import React, { useState, useRef, useEffect, useCallback } from "react"
import styled from "styled-components"
//import domtoimage from "dom-to-image-more";
import eventBus from "/src/components/communication/EventBus"
import TranslateText from "/src/components/translate/TranslateText"
import { getTranslatedText } from "/src/components/translate/TranslateText";
import Quote from '/src/components/layout/quote/Quote'
import CarinaSignature from "/src/components/themes/icons/CarinaSignature"
import { BsInstagram } from 'react-icons/bs'
import { FiMail } from 'react-icons/fi'
import { TfiWorld } from "react-icons/tfi";
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/ai";
import { MdCollections, MdOutlineImage } from "react-icons/md";

import "typeface-open-sans"
import "typeface-josefin-sans"

const getDomToImage = (() => {
  if (typeof window !== 'undefined') {
    //return require('dom-to-image-more')
    return require('html-to-image')
  }
})

/*const getSiteURL = (site) => {
  if(process.env.GATSBY_SITE_URL)
      return process.env.GATSBY_SITE_URL
  if(site && site.siteMetadata){
    if(site.siteMetadata.siteUrl)
      return site.siteMetadata.siteUrl
    if(site.siteMetadata.url)
      return site.siteMetadata.url
  }
  return "https://www.carinamiras.art"
}*/

const getSizesText = (sizes, type = 'cm') => {
  if(!sizes)
    return null
  let txt = ''
  const mesureText = (type === 'inch' ? '"' : 'cm')
  
  for(let i = 0; i < sizes.length; i++){
    const { cm, inch } = (sizes[i] || {})
    const { height, width } = ( (type === 'inch' ? inch : cm) || {})
    if(height === undefined || width === undefined)
      continue 
    if(txt !== '')
      txt+=" | "
    txt += width + mesureText+" x " + height + mesureText
  }
  return txt
}

const getTitle = (paint, serie) => {
  const { title, wallLabel } = (paint || {})
  const { title : serieTitle, wallLabel : serieWallLabel } = (serie || {})
  const { title : paintWL } = (wallLabel || {})
  const { title : serieWL } = (serieWallLabel || {})
  return paintWL || title || serieWL || serieTitle
}

const getSubTitle = (paint, serie, isSerie) => {
  const { subtitle, wallLabel} = (paint || {})
  const { subtitle : serieSubtitle, wallLabel : serieWallLabel } = (serie || {})
  const { subtitle : paintWL } = (wallLabel || {})
  const { subtitle : serieWL } = (serieWallLabel || {})

  return paintWL || serieWL || subtitle || serieSubtitle
}

const getDescription = (paint, serie) => {
  const { classification, sizes, wallLabel } = (paint || {})

  if(wallLabel && wallLabel.description)
    return wallLabel.description

  const { technique, surface } = (classification || {})
  const techniqueText = technique === undefined ? null : getTranslatedText('Technique.withSurface', null, [ technique, surface.toLowerCase() ], true)

  const sizesText = getSizesText(sizes)

  let txt = ''
  if(sizesText !== null)
    txt += sizesText
  if(sizesText !== null && techniqueText !== null){
    txt += ' / '
  }
  if(techniqueText !== null)
    txt += techniqueText

  // Si en total hi ha més de 50 caràcters, fem salt de línia
  const doBreakLine = txt.length > 50

  txt = ''
  if(sizesText !== null)
    txt += '<span>'+ sizesText + '</span>'
  if(sizesText !== null && techniqueText !== null)
    txt += doBreakLine? '<br>' : ' <b>/</b> '
  
  if(techniqueText !== null)
    txt += '<span>'+techniqueText+'</span>'
  return txt
}

const WallLabel = ({paint, serie, serieId, site, isSerie = false, titlePrefix = "", allowToHide = false, initVisible=false, imageFileType='png', showQRCode=true}) => {
    //const data = useStaticQuery(query)
    const domEl = useRef(null)

    const [ initialized, setInitialized ] = useState(false);
    const [ domtoimage, setDomtoimage ] = useState()
    const [ paintVisible, setPaintVisible ] = useState(initVisible)
    const [ isDownloading, setIsDownloading ] = useState(false)
    
    const { title, date, reference, pageName, id} = (paint || {})
    //const { description, wallLabel, body} = paint
    const { sellingData, quote = {}, qrCode} = (paint || {})
    //const { classification, sizes } = paint
    //const { title : serieTitle } = (serie || {})
    //const { subtitle : serieSubtitle } = (serie || {})
    //const { composition, technique, orientation, serie : cSerie, style, surface, category, tags } = classification
    const { productState, priceEur, showPrice } = (sellingData || {})
    //const { showProductState, priceDollar, showPrice } = (sellingData || {})

    //const urlSite = getSiteURL(site)
    const author = site && site.siteMetadata ? site.siteMetadata.author : ""
    //const year = (!date instanceof Date ? new Date() : date).Year()
    const year = date

    const wlTitle = getTitle(paint, serie, isSerie)
    const wlSubtitle = getSubTitle(paint, serie, isSerie)
    const wlDescription = getDescription(paint, serie)

    const saveWallLabelAsImage = useCallback(async(data) => {
      if(isDownloading)
        return 
      
      setIsDownloading(true)
      setPaintVisible(true)

      const type = data ? data.imageFileType : ""
      let d2i = domtoimage
      if(!d2i){
        d2i = getDomToImage()
        setDomtoimage(d2i)  
      }

      if(!d2i)
        return

      let callFunction = "toPng"
      let extension = "png"
      let effectiveType = type || imageFileType
      switch(effectiveType){
        case "jpg":
          extension = "jpg"
          callFunction = "toJpeg"
          break;
        default:
          extension = "png"
          callFunction = "toPng"
      }
      if(!d2i[callFunction])
        return;

      // Apliquem un retard per assegurar que està tot obert i sense animacions pendents
      setTimeout(function(){
        d2i[callFunction](domEl.current, { cacheBust : true, preferredFontFormat: "ttf" }).then(function (dataUrl) {
            const link = document.createElement('a');

            const name = (isSerie? (reference || pageName || serieId) : (reference || pageName) )

            link.download = (name || id) + "-wall-label."+extension;
            link.href = dataUrl;
            link.click();
            setTimeout(function(){
              setIsDownloading(false)
            },1000)
          }).catch((err) => {
            console.log(err);
          });
      },1000);
    },[ isDownloading, isSerie, domtoimage, id, pageName, reference, serieId, imageFileType])

    useEffect(() => {
      if (!initialized) {
      
        eventBus.on("setVisiblePaint", ({paintId, show}) => {
          if(paintId !== id)
            return
          setPaintVisible(show)
        }, id);

        eventBus.on("setVisibleSeriePaints", ({id, show}) => {
          if(serieId !== id)
            return
          setPaintVisible(show)
        }, serieId);

        eventBus.on("setDownloadSerieWallLabelsPaintsAsImage", ({id}) => {
          //if(serieId !== id || !paintVisible)
          if(serieId !== id)
            return
          saveWallLabelAsImage()
        }, serieId);
      
        setInitialized(true)
      }
    },[ initialized, paintVisible, id, pageName, serieId, saveWallLabelAsImage ]);

    if(!paint || !site)
        return null

    const toggleVisiblePaint = () => {
      setPaintVisible(!paintVisible)
    }

    return (
      <WallLabelRoot>
        {allowToHide &&
            <WallLabelPaintTitle
              onClick={() => toggleVisiblePaint()}>
              <WallLabelPaintTitleClickable>
                {isSerie && <StyledMdCollections />}
                {!isSerie && <StyledMdOutlineImage />}
                {titlePrefix}
                <i> "{title}"</i>
              </WallLabelPaintTitleClickable>

              <StyledDropdownIcon>
                {paintVisible && 
                  <AiFillCaretUp />
                }
                {!paintVisible && 
                  <AiFillCaretDown />
                }
              </StyledDropdownIcon>
            </WallLabelPaintTitle>
          }
        <WallLabelWrapper
            className={(!allowToHide || paintVisible) ? 'is-visible' : 'is-not-visible'}>
            
          <WallLabelActionsWrapper>
            <WLActionElement
              onClick={() => saveWallLabelAsImage()}
              ><TranslateText text='Download' /></WLActionElement>
          </WallLabelActionsWrapper>
          
          <WallLabelElementContainerWrapper>
            <WallLabelElementContainer>
              <WallLabelContainer
                ref={domEl}>
                  <ContentBlock>
                    <TitlesBlock>
                      <TitlesWrapper>
                        {(wlSubtitle) &&
                          <PaintSubTitleContainer>{wlSubtitle}</PaintSubTitleContainer>
                        }
                        <PaintTitleContainer
                        >{wlTitle}</PaintTitleContainer>
                      </TitlesWrapper>
                      <AuthorContainer>{author}</AuthorContainer>
                      {year &&
                        <PaintYearContainer>{year}</PaintYearContainer>
                      }

                      {wlDescription &&
                        <PaintDescription dangerouslySetInnerHTML={{__html:wlDescription}} />
                      }
                    </TitlesBlock>

                    {quote && quote.text && 
                      <QuoteWrapper
                        className={quote.text.length > 200 ? 'apply-smaller-text' : ''}>
                        <Quote quote={quote} showLeftIcon={true} showRightIcon={true} />
                      </QuoteWrapper>
                    }

                    {showQRCode && qrCode &&
                      <QRCodeContainer>
                        <img src={qrCode} alt={title} />
                      </QRCodeContainer>
                    }

                    
                  </ContentBlock>
                  
                  <LogoContainer className="logo-container">
                    <CarinaSignature />
                  </LogoContainer>
                  
                  { productState !== 'Sold' && showPrice && 
                      <PriceBlock>
                        {priceEur}€
                      </PriceBlock>
                  }
                  <SocialContainer>
                      <SocialMediaList>
                      <SocialMediaElement>
                          <span className='socialmedia-element'><StyledIcon className='sm-icon'><BsInstagram /></StyledIcon><span className='socialmedia-text'>@carina.miras.art</span></span>
                        </SocialMediaElement>
                        <SocialMediaElement>
                          <span className='socialmedia-element sm-remark'><StyledIcon className='sm-icon'><TfiWorld /></StyledIcon><span className='socialmedia-text'>www.carinamiras.art</span></span>
                        </SocialMediaElement>
                        <SocialMediaElement>
                          <span className='socialmedia-element'><StyledIcon className='sm-icon'><FiMail /></StyledIcon><span className='socialmedia-text'>hi@carinamiras.art</span></span>
                        </SocialMediaElement>
                      </SocialMediaList>
                  </SocialContainer>
              </WallLabelContainer>
            </WallLabelElementContainer>
            </WallLabelElementContainerWrapper>
        </WallLabelWrapper>
      </WallLabelRoot>
    )
}

export default WallLabel
/*
const query = graphql`
  query data {
    site {
      siteMetadata {
        title
        titleTemplate
        author
        siteUrl
        social {
          mail,
          instagram,
          linkedin,
          facebook
        }
      }
    }
  }
  `
*/
const WallLabelRoot = styled.article`

`
const WallLabelWrapper = styled.div`
  &.is-not-visible{
    display:none;
  }
`

const WallLabelElementContainerWrapper = styled.div`
  overflow:auto;
  padding:0.5em;
  border:1px solid #ccc;
`
const WallLabelElementContainer = styled.div`
  display:flex;
  justify-content: center;
  flex-direction: row;
  min-height:15cm;
  min-width: 15cm;
  width:100%;
  margin:auto;
  position:relative;
`

const WallLabelPaintTitle = styled.h3`
  cursor: pointer;
  display:grid;
  grid-template-columns: 1fr 50px;

  transition:color 0.5s ease;
  :hover{
    color : var(--primary-link-hover-color);
  }

  @media print {
    display:none;
  }
`

const WallLabelPaintTitleClickable = styled.a`
  text-decoration: none;
  align-content:center;
`

const StyledMdCollections = styled(MdCollections)`
  margin-right: 0.5em;
`
const StyledMdOutlineImage = styled(MdOutlineImage)`
  margin-right: 0.5em;
`

const StyledDropdownIcon = styled.div`
  text-align:center;
  align-content:center;
`

const WallLabelActionsWrapper = styled.div`
  width:100%;
  text-align:center;
`

const WLActionElement = styled.span`
  display:inline-block;
  position:relative;
  padding: 0 1em;
  color: var(--primary-link-color);
  transition: all 0.2s ease-in;
  cursor: pointer;

  :hover{
    color : var(--primary-link-hover-color);
  }
`

const WallLabelContainer = styled.div`
  display:flex;
  justify-content:space-between;
  align-content: stretch;
  overflow:hidden;
  
  position: relative;
  border: 1px solid #333;
  background:white;
  z-index:0;
  width:15cm;
  height: 15cm;
  text-align: center;

  page-break-inside: avoid;
  break-inside: avoid;
`

const ContentBlock = styled.div`
  display:flex;
  justify-content:center;
  flex-direction: column;
  flex:1;
  justify-content: center;
  z-index:1;
  padding-top:2rem;
  padding-bottom: 3rem;
`
const TitlesBlock = styled.div`
`

const LogoContainer = styled.div`
  position: absolute;
  font-size: 20rem;
  top: -12%;
  right: -17%;
  opacity: 0.08;
  line-height: 1rem;
  z-index:-1;
  transform:rotate(-10deg)
`

const QRCodeContainer = styled.div`
  img{
    width:100px;
    height:100px;
  }
`
const TitlesWrapper = styled.div`
  padding:2em 0 0 0;
`
const PaintTitleContainer = styled.h1`
  font-family: var(--title-font-family);
  font-size: 2.5rem;
  font-weight: bold;
  margin:0;
  padding:0;
  line-height: 3rem;
`
const PaintSubTitleContainer = styled.h2`
  font-family: var(--title-font-family);
  margin:0;
  padding:0;
  font-weight:400;
`

const AuthorContainer = styled.h3`
  font-family: var(--title-font-family);
  font-weight: 400;
  font-style:italic;
  margin:0;padding:0;
`

const PaintYearContainer = styled.h3`
  display: none;
  font-family: var(--title-font-family);
  font-weight: 400;
  margin:0;padding:0;
`

const PriceBlock = styled.div`
  font-family: var(--title-font-family);
  color:#ccc;
  font-size: 2rem;
  line-height:2rem;
  position:absolute;
  bottom:3rem;
  left:3rem;
`

const QuoteWrapper = styled.div`

  &.apply-smaller-text{
    blockquote{
      font-size: 0.9em;
    }
    blockquote,
    blockquote span{
      line-height: 1.5em;
    }
  }

  figure{
    max-width: 80%;
  }

  blockquote,
  blockquote span{
    text-align: center !important;
    line-height: 1.8em;
  }

  figcaption::before{
    color:#e6e6e6;
    opacity:1;
  }

  .quote-icon{
    color: #e6e6e6;
    opacity:1;
  }

  .quote-icon.icon-left{
    right: calc(100% + 10px)
  }

  .quote-icon.icon-right{
    left: calc(100% + 10px)
  }
`

const PaintDescription = styled.div`
  span, b{
    display:inline-block;
    text-overflow:ellipsis;
    overflow:hidden;
  }
  span{
    padding: 0 10px;
  }
`

const SocialContainer = styled.div`
  position:absolute;
  bottom:0;
  width:100%;
  height: 3rem;
  line-height: 3rem;
  vertical-align:middle;
`

const SocialMediaList = styled.ul`
  position:relative;
  display:flex;
  flex-direction: row;
  justify-content: center;
  align-content: center;
  align-items: center;
  text-align: center;
  gap: 1rem;
  list-style: none;
  z-index:1;
  margin:0;
`
const SocialMediaElement = styled.li`
    text-decoration: none;
    line-height:3rem;
    height:3rem;
    vertical-align:middle;
    color: gray;
    text-overflow:ellipsis;
    overflow:hidden;
    font-size:0.9rem;

    .socialmedia-text{
      color: #333;
    }

    .sm-remark{
      font-weight: bold;
      
      .sm-icon{
        display:none;
      }
    }
`

const StyledIcon = styled.span`
    display:inline-block;
    font-size:0.8em;
    margin-right:4px;
    vertical-align:middle;
`