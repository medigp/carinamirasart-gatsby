import React, { useState, useEffect } from "react"
import styled from "styled-components"
import eventBus from "/src/components/communication/EventBus"
import WallLabel from "/src/components/layout/wallLabel/WallLabel"
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineSave } from "react-icons/ai";

const WallLabelSerie = ({paints, serie, serieId, site, allowToHide = false, initVisible=false, imageFileType='png', showQRCode=true}) => {
    //const data = useStaticQuery(query)

    const [ initialized, setInitialized ] = useState(false);
    const [ serieVisible, setSerieVisible ] = useState(initVisible)
    
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

    const toggleVisibleSerie = () => {
      eventBus.dispatch("setVisibleSeriePaints", {id : serieId, show : !serieVisible}, serieId)
      setSerieVisible(!serieVisible)
    }

    const saveSeriePaintsWallLabelAsImage = () => {
      eventBus.dispatch("setDownloadSerieWallLabelsPaintsAsImage", {id : serieId, imageFileType}, serieId)
    }

    return (
      <WallLabelRoot>
        
        <WallLabelSerieTitle>
          {allowToHide &&
              <StyledEyeIcon
                onClick={() => toggleVisibleSerie()}>
                {serieVisible && 
                  <AiOutlineEye />
                }
                {!serieVisible && 
                  <AiOutlineEyeInvisible />
                }
              </StyledEyeIcon>
            }
            <WallLabelSerieTitleClickable
              onClick={() => toggleVisibleSerie()}
              >
              {title &&
                <span>{title}: </span>
              }
              {subtitle || serieId}
            </WallLabelSerieTitleClickable>
            
            {serieVisible && 
              <StyledSaveIcon
                  onClick={() => saveSeriePaintsWallLabelAsImage()}>
                  <AiOutlineSave />
              </StyledSaveIcon>
            }            
        </WallLabelSerieTitle>
          
        <WallLabelWrapper
            className={(!allowToHide || serieVisible) ? 'is-visible' : 'is-not-visible'}>
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
        </WallLabelWrapper>
      </WallLabelRoot>
    )
}

export default WallLabelSerie

const WallLabelRoot = styled.article`

`
const WallLabelSerieTitle = styled.h2`
position: relative;
cursor: pointer;

::after,
::before{
    position:absolute;
    display:block;
    content:'';
    width:100%;
    height:5px;
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

@media print {
  display:none;
}
`

const WallLabelSerieTitleClickable = styled.a`
  text-decoration: none;
`

const WallLabelWrapper = styled.div`
  width:100%;
  margin-bottom: 2em;

  &.is-not-visible{
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
const PaintWrapper = styled.div`
  
  &.hide-label{
    .wall-label-content{
      display:block;
    }
  }
`

const WallLabelContent = styled.div`

`
