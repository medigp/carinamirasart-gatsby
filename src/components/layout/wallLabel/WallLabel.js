import React, { useState, useRef } from "react"
import styled from "styled-components"
//import domtoimage from "dom-to-image-more";
import eventBus from "/src/components/communication/EventBus"
import { getTranslatedText } from "/src/components/translate/TranslateText";
import Quote from '/src/components/layout/quote/Quote'
import CarinaSignature from "/src/components/themes/icons/CarinaSignature"
import { BsInstagram } from 'react-icons/bs'
import { FiMail } from 'react-icons/fi'
import { TfiWorld } from "react-icons/tfi";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineSave } from "react-icons/ai";

import "typeface-open-sans"
import "typeface-josefin-sans"

const domtoimage = (() => {
  if (typeof window !== 'undefined') {
    return require('dom-to-image-more')
  }
})

const getSiteURL = (site) => {
  if(process.env.GATSBY_SITE_URL)
      return process.env.GATSBY_SITE_URL
  if(site && site.siteMetadata){
    if(site.siteMetadata.siteUrl)
      return site.siteMetadata.siteUrl
    if(site.siteMetadata.url)
      return site.siteMetadata.url
  }
  return "https://www.carinamiras.art"
}

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
const getDescription = (paint) => {
  const { classification, sizes } = paint
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

const WallLabel = ({paint, serie, serieId, site, allowToHide = false, initVisible=false}) => {
    //const data = useStaticQuery(query)
    const domEl = useRef(null);
    const [ paintVisible, setPaintVisible ] = useState(initVisible)
    const [ isDownloading, setIsDownloading ] = useState(false)
    if(!paint || !site)
        return null

    const { breadcrumbs, title, subtitle, description, wallLabelDescription, body, date, reference, pageName, id} = paint    
    const { sellingData, classification, sizes, quote = {}} = paint
    const { title : serieTitle, subtitle : serieSubtitle } = (serie || {})
    const { composition, technique, orientation, serie : cSerie, style, surface, category, tags } = classification
    const { productState, showProductState, priceEur, priceDollar, showPrice } = (sellingData || {})
    const { cm } = (sizes || {})
    const { height, width , breadth } = (cm || {})

    const urlSite = getSiteURL(site)
    const author = site.siteMetadata.author
    //const year = (!date instanceof Date ? new Date() : date).Year()
    const year = date
    const wlDescription = getDescription(paint)
    

    const social = site.siteMetadata.social

    eventBus.on("setVisiblePaint", ({paintId, show}) => {
      if(paintId !== id)
        return
        setPaintVisible(show)
    });

    eventBus.on("setVisibleSeriePaints", ({id, show}) => {
      if(serieId !== id)
        return
        setPaintVisible(show)
    });

    eventBus.on("setDownloadSerieWallLabelsPaintsAsImage", ({id}) => {
      if(serieId !== id || !paintVisible)
        return
        saveWallLabelAsImage()
    });


    const toggleVisiblePaint = () => {
      setPaintVisible(!paintVisible)
    }

    const saveWallLabelAsImage = async() => {
      if(isDownloading)
        return 
      
      setIsDownloading(true)
      setPaintVisible(true)

      if(domtoimage !== null)
        domtoimage.toPng(domEl.current, { cacheBust : true, preferredFontFormat: "ttf" }).then(function (dataUrl) {
          const link = document.createElement('a');
          link.download = (reference || pageName || id) + "-wall-label.png";
          link.href = dataUrl;
          link.click();
          setTimeout(function(){
            setIsDownloading(false)
          },1000)
        });
    }

    return (
      <WallLabelRoot>
        {allowToHide &&
            <WallLabelPaintTitle>
              <StyledEyeIcon
                onClick={() => toggleVisiblePaint()}>
                {paintVisible && 
                  <AiOutlineEye />
                }
                {!paintVisible && 
                  <AiOutlineEyeInvisible />
                }
              </StyledEyeIcon>
              <span
                onClick={() => toggleVisiblePaint()}>
                {title}
              </span>
              {paintVisible && 
                <StyledSaveIcon
                  onClick={() => saveWallLabelAsImage()}>
                  <AiOutlineSave />
                </StyledSaveIcon>
              }
            </WallLabelPaintTitle>
          }
        <WallLabelWrapper
            className={(!allowToHide || paintVisible) ? 'is-visible' : 'is-not-visible'}>
          <WallLabelContainer
            id={domEl}
            ref={domEl}>
              <ContentBlock>
                <TitlesBlock>
                  <PaintSubTitleContainer>{serieSubtitle || subtitle}</PaintSubTitleContainer>
                  <PaintTitleContainer>{title}</PaintTitleContainer>
                  <AuthorContainer>{author}</AuthorContainer>

                  <LogoContainer>
                    <CarinaSignature />
                  </LogoContainer>
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
                { productState !== 'Sold' && 
                  <PriceBlock>
                    {priceEur}€
                  </PriceBlock>
                }
              </ContentBlock>

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
  display:flex;
  justify-content: center;
  flex-direction: row;
  min-height:400px;
  max-width: 15cm;
  width:100%;
  height: 15cm;
  margin:auto;
  position:relative;

  &.is-not-visible{
    display:none;
  }
`

const WallLabelPaintTitle = styled.h3`
  cursor: pointer;

  @media print {
    display:none;
  }
`

const StyledEyeIcon = styled.div`
  display:inline-block;
  margin-right: 10px;
`
const StyledSaveIcon = styled.div`
  display:inline-block;
  float:right;
`

const WallLabelContainer = styled.div`
  display:flex;
  flex-direction: column;
  justify-content:space-between;
  flex-wrap:nowrap;
  align-content: stretch;
  overflow:hidden;
  
  position: relative;
  border: 1px solid #333;
  background:white;
  z-index:0;
  width:100%;
  height: 100%;
  text-align: center;

  page-break-inside: avoid;
  break-inside: avoid;
  
`

const ContentBlock = styled.div`
  display:flex;
  justify-content:center;
  flex-direction: column;
  flex:1;
  gap: 1em;
  z-index:1;
`
const TitlesBlock = styled.div`

`

const LogoContainer = styled.div`
  display:none;
`
const PaintTitleContainer = styled.h1`
  font-family: var(--title-font-family);
  font-size: 2.5rem;
  font-weight: bold;
  margin:0;padding:0;
  line-height: 2rem;
`
const PaintSubTitleContainer = styled.h2`
  font-family: var(--title-font-family);
  margin:0;
  padding:2em 0 0 0;
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
  font-size: 2em;
  color:#ccc;
  display:none;
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
  span{
    display:inline-block;
    padding: 0 10px;
  }
`

const SizesContainer = styled.div`
`

const SocialContainer = styled.div`
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
`
const SocialMediaElement = styled.li`
    text-decoration: none;
    line-height:22px;
    height:22px;
    vertical-align:middle;
    color: gray;

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