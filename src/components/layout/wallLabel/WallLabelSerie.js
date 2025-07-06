import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { getTranslatedText } from '/src/components/translate/TranslateText'
import eventBus from "/src/components/communication/EventBus"
import WallLabel from "/src/components/layout/wallLabel/WallLabel"
import TranslateText from "/src/components/translate/TranslateText"
import { AiFillCaretDown, AiFillCaretUp } from "react-icons/ai";

const WallLabelSerie = ({paints, serie, serieId, site, allowToHide = false, initVisible=false, imageFileType='png', showQRCode=true}) => {
    //const data = useStaticQuery(query)

    const [ initialized, setInitialized ] = useState(false);
    const [ serieVisible, setSerieVisible ] = useState(initVisible)
    const [ serieVisiblePaints, setSerieVisiblePaints ] = useState(initVisible)
    
    const { title, subtitle } = (serie || {})

    useEffect(() => {
      if (!initialized) {
        eventBus.on("setVisibleSerie", ({id, show}) => {
          if(serieId !== id)
            return
          setSerieVisible(show)
        }, serieId);
        setInitialized(true)
      }
    },[ initialized, serieId ]);

    if(!paints)
        return null

    const toggleVisibleSeriePaints = () => {
      eventBus.dispatch("setVisibleSeriePaints", {id : serieId, show : !serieVisiblePaints}, serieId)
      setSerieVisiblePaints(!serieVisiblePaints)
    }

    const toggleVisibleSerie = () => {
      eventBus.dispatch("setVisibleSerie", {id : serieId, show : !serieVisible}, serieId)
      setSerieVisible(!serieVisible)
    }

    const saveSeriePaintsWallLabelAsImage = () => {
      eventBus.dispatch("setDownloadSerieWallLabelsPaintsAsImage", {id : serieId, imageFileType}, serieId)
    }

    const serieWallLabelTitlePrefix = getTranslatedText('WallLabels.serie.prefix')
    const paintWallLabelTitlePrefix = getTranslatedText('WallLabels.painting.prefix')

    return (
      <WallLabelRoot
        className={(serieVisible ? 'element-expanded' : 'element-collapsed')}>
        
        <WallLabelSerieTitle
          onClick={() => toggleVisibleSerie()}>
            <WallLabelSerieTitleClickable>
              {title &&
                <span>{title}: </span>
              }
              {subtitle &&
                <i>"{subtitle || serieId}"</i>
              }
            </WallLabelSerieTitleClickable>

            {allowToHide &&
              <StyledDropdownIcon>
                {serieVisible && 
                  <AiFillCaretUp />
                }
                {!serieVisible && 
                  <AiFillCaretDown />
                }
              </StyledDropdownIcon>
            } 
        </WallLabelSerieTitle>
        

        <WallLabelWrapper
            className={ 'serie-wrapper ' + ((!allowToHide || serieVisible) ? 'is-visible' : 'is-not-visible')}>
          
          <WallLabelActionsWrapper>
            <WLActionElement
              onClick={() => toggleVisibleSeriePaints()}
              >
                {!serieVisiblePaints &&
                  <TranslateText text='Show.all' />}
                {serieVisiblePaints &&
                  <TranslateText text='Hide.all' />}
            </WLActionElement>
            <WLActionElement
              onClick={() => saveSeriePaintsWallLabelAsImage()}
              ><TranslateText text='Download.all' /></WLActionElement>
          </WallLabelActionsWrapper>

          <WallLabelPaintsWrapper
            className={(!allowToHide || serieVisible) ? 'is-visible' : 'is-not-visible'}>

            <PaintWrapper
                key={serieId}
                className={'paint-wrapper serie-element'}
              >
                <WallLabelContent
                  className={'wall-label-content'}
                  >
                  <WallLabel
                    paint={serie}
                    serie={serie}
                    isSerie={true}
                    titlePrefix={serieWallLabelTitlePrefix}
                    serieId={serieId}
                    site={site}
                    allowToHide={allowToHide}
                    initVisible={initVisible}
                    imageFileType={imageFileType}
                    showQRCode={showQRCode}
                  />
                  </WallLabelContent>

              </PaintWrapper>

          {
            paints.map((paint, pindex) => (
              <PaintWrapper
                key={pindex}
                className={'paint-wrapper'}
              >
                <WallLabelContent
                  className={'wall-label-content'}
                  >
                  <WallLabel
                    paint={paint}
                    serie={serie}
                    titlePrefix={paintWallLabelTitlePrefix}
                    serieId={serieId}
                    site={site}
                    allowToHide={allowToHide}
                    initVisible={initVisible}
                    imageFileType={imageFileType}
                    showQRCode={showQRCode}
                  />
                  </WallLabelContent>

              </PaintWrapper>
            ))
          }
          </WallLabelPaintsWrapper>

        </WallLabelWrapper>
      </WallLabelRoot>
    )
}

export default WallLabelSerie

const WallLabelRoot = styled.article`
  margin-bottom: 2em;
  border-radius: 10px;
  border:1px solid transparent;
  height:auto;
  transition: all 0.2s ease-in 0.1s;

  &.element-expanded{
    border-color:var(--alternative-color);
  }
`
const WallLabelSerieTitle = styled.h2`
  position: relative;
  cursor: pointer;
  margin: 0;
  padding: 0.5em;
  display:grid;
  grid-template-columns: 1fr 50px;

  ::after,
  ::before{
      position:absolute;
      display:block;
      content:'';
      width:100%;
      height:5px;
      left:0;
      bottom:0px;
      background:var(--alternative-color);
      z-index:2;
  }

  ::before{
      background:var(--secondary-color);
      z-index:3;
      width:0px;
      transition: all 0.2s ease-in 0.1s;
  }

  transition:color 0.5s ease;
  :hover{
    color : var(--primary-link-hover-color);
  }

  @media print {
    display:none;
        
    &.element-expanded{
      background:var(--print-bg-color);
      color: var(--primary-color);
    }
  }
`

const WallLabelSerieTitleClickable = styled.a`
  text-decoration: none;
  align-content:center;
`

const WallLabelWrapper = styled.div`
  
  padding: 1em;
  position: relative;

  transition: all 0.2s;
  transform: scale(1);
  height: auto;
  
  &.is-not-visible{
    visibility:hidden;
    transform: scale(0);
    height:0;
  }
`
const WallLabelActionsWrapper = styled.div`
  width:100%;
  text-align:right;
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

const WallLabelPaintsWrapper = styled.div`
width:100%;
margin-bottom: 2em;

&.is-not-visible{
  display:none;
}
`

const StyledDropdownIcon = styled.div`
  text-align:center;
  align-content:center;
`

const PaintWrapper = styled.div`
  
  &.hide-label{
    .wall-label-content{
      display:block;
    }
  }
`

const WallLabelContent = styled.div`

`
