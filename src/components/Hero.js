import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { Link } from "gatsby"
import { getTranslatedText } from "./translate/TranslateText"
import ScratchRevealBackground from "./ScratchRevealBackground"
import CarinaSignature from "/src/components/themes/icons/CarinaSignature"
import indexBackground from "/src/images/index-background.jpeg"

const scratchVariants = [
  { value: "cakeCut", label: "Tall de pastis" },
  { value: "impastoScrape", label: "Acrilic gratat" },
  { value: "openingImpastoScrape", label: "Acrilic obert" },
  { value: "psychedelicOpen", label: "Senyals psicodeliques" },
  { value: "markerLine", label: "Linia continua" },
  { value: "cleanScratch", label: "Solc net" },
  { value: "irregularScratch", label: "Rascat irregular" },
  { value: "subtleBrush", label: "Pinzell subtil" },
  { value: "softBrush", label: "Pinzell suau" },
  { value: "softBrushStitched", label: "Pinzell suau 2" },
  { value: "continuousSoftBrush", label: "Pinzell continu subtil" },
  { value: "continuousBrush", label: "Pinzell continu" },
  { value: "strangeBrush", label: "Pinzell estrany" },
  { value: "softWear", label: "Desgast suau" },
]

const Hero = () => {
    const [isStarted, setIsStarted] = useState(false)  
    const [scratchVariant, setScratchVariant] = useState("openingImpastoScrape")
    const [scratchDuration, setScratchDuration] = useState(0)
    const [scratchLength, setScratchLength] = useState(0)
    const [useBackgroundImage, setUseBackgroundImage] = useState(true)
    const [showBackgroundTexture, setShowBackgroundTexture] = useState(false)
    const [scratchThickness, setScratchThickness] = useState(1)
    const [hideOnScratch, setHideOnScratch] = useState(false)

    const title = getTranslatedText('Page.Title')
    const subtitle = getTranslatedText('Page.SubTitle')

    useEffect(() => {
      const timeout = setTimeout(function(){
        setIsStarted(true)
      }, 500);

      return () => clearTimeout(timeout)
    }, [])

    return (
        <HeroContainer
          className={'transition-element' + (isStarted ? '' : ' not-started')}>
            <ScratchRevealBackground
              key={`${scratchVariant}-${scratchDuration}-${scratchLength}-${hideOnScratch}`}
              variant={scratchVariant}
              maxAgeSeconds={scratchDuration}
              maxMarks={scratchLength}
              backgroundImage={useBackgroundImage ? indexBackground : null}
              showBackgroundTexture={showBackgroundTexture}
              strokeScale={scratchThickness}
              hideOnScratch={hideOnScratch}
            />
            
            <HeroContent>
                <HeroItems>
                    <HeroLogo>
                      <CarinaSignature />
                    </HeroLogo>
                    <HeroH1>{title}</HeroH1>
                    <HeroP>{subtitle}</HeroP>
                    <HeroLink to="/gallery">Descobreix l&apos;obra</HeroLink>
                </HeroItems>
            </HeroContent>
            { false &
            <VariantControl>
              <VariantLabel htmlFor="scratch-variant">Efecte</VariantLabel>
              <VariantSelect
                id="scratch-variant"
                value={scratchVariant}
                onChange={(event) => setScratchVariant(event.target.value)}
              >
                {scratchVariants.map((variant) => (
                  <option key={variant.value} value={variant.value}>
                    {variant.label}
                  </option>
                ))}
              </VariantSelect>
              <VariantField>
                <VariantLabel htmlFor="scratch-duration">Temps (s)</VariantLabel>
                <VariantInput
                  id="scratch-duration"
                  type="number"
                  step="1"
                  value={scratchDuration}
                  onChange={(event) => setScratchDuration(Number(event.target.value))}
                />
              </VariantField>
              <VariantField>
                <VariantLabel htmlFor="scratch-length">Longitud</VariantLabel>
                <VariantInput
                  id="scratch-length"
                  type="number"
                  step="10"
                  value={scratchLength}
                  onChange={(event) => setScratchLength(Number(event.target.value))}
                />
              </VariantField>
              <VariantField>
                <VariantLabel htmlFor="scratch-thickness">Gruix</VariantLabel>
                <VariantInput
                  id="scratch-thickness"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={scratchThickness}
                  onChange={(event) => setScratchThickness(Number(event.target.value))}
                />
              </VariantField>
              <VariantCheckLabel>
                <VariantCheck
                  type="checkbox"
                  checked={useBackgroundImage}
                  onChange={(event) => {
                    setUseBackgroundImage(event.target.checked)
                    setShowBackgroundTexture(!event.target.checked)
                  }}
                />
                Imatge
              </VariantCheckLabel>
              <VariantCheckLabel>
                <VariantCheck
                  type="checkbox"
                  checked={hideOnScratch}
                  onChange={(event) => setHideOnScratch(event.target.checked)}
                />
                Amaga
              </VariantCheckLabel>
              <VariantCheckLabel>
                <VariantCheck
                  type="checkbox"
                  checked={showBackgroundTexture}
                  onChange={(event) => setShowBackgroundTexture(event.target.checked)}
                />
                Trama
              </VariantCheckLabel>
            </VariantControl>
            }
        </HeroContainer>
    )
}

export default Hero

const HeroContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    height: calc(100vh - var(--header-height));
    min-height:200px;
    min-height: calc(100vh - 100px);
    width:100%;
    color: var(--primary-color);
    position:relative;
    overflow:hidden;

    @media (max-width: 760px){
      height: 82svh;
      height: calc(82svh - var(--header-height));
      min-height: 360px;
    }

    @media (max-height: 400px){
      height: calc(100svh - var(--header-height));
      min-height: 0;
    }

    &.transition-element{

      h1, p{
        transition: all 0.5s ease-in-out;
      }

      &.not-started{
        h1, p{
          font-size: clamp(0.25rem, 0.75vw, 0.75rem);
        }
      }

    }

    @media print {
      height: auto;
      flex-direction:column;
      align-items: flex-start;
      max-width: var(--max-content-width);
      margin: auto;
      min-height:auto;
    }
`

const HeroContent = styled.div`
    z-index:3;
    height: 100%;
    max-height: 100%;
    padding: 0rem calc((100vw - 1300px) / 2);

    @media print {
      padding:0;
      height: auto;
    }
`

const HeroItems = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 100%;
    padding:0;
    color: var(--primary-color);
    line-height: 1.2em;
    text-transform: uppercase;
    position: relative;
    max-width: min(760px, calc(100vw - 3rem));

    @media (max-height: 400px){
      max-width: min(620px, calc(100vw - 2rem));
    }

    @media print {
      text-align: left;
      align-items: flex-start;
    }
`

const HeroLogo = styled.div`
    color: var(--primary-color);
    font-size: clamp(7rem, 18vw, 12rem);
    line-height: 0.65;
    margin-bottom: 0.45rem;
    opacity: 0.9;

    @media (max-height: 400px){
      font-size: clamp(4.2rem, 24vh, 6.5rem);
      margin-bottom: 0.25rem;
    }

    @media print {
      display:none;
    }
`

const HeroH1 = styled.h1`
    display:inline-block;
    margin:0;
    font-size: clamp(1.75rem, 3vw, 2rem);
    font-family:var(--menu-font-family);
    font-weight: 100;
    letter-spacing:0;

    @media (max-height: 400px){
      font-size: clamp(1rem, 5vh, 1.35rem);
    }

    @media print {
      display:none;
    }
`
const HeroP = styled.p`
    display:inline-block;
    font-family:var(--menu-font-family);
    font-size: clamp(0.75rem, 1.5vw, 1.2rem);
    color: var(--primary-color);
    font-weight: 100;
    letter-spacing:0;
    margin: 0.8rem 0 1.4rem;

    @media (max-height: 400px){
      margin: 0.35rem 0 0.75rem;
      font-size: clamp(0.72rem, 3.6vh, 0.9rem);
    }

    @media print {
      color:black;
    }
`

const HeroLink = styled(Link)`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.8rem;
    padding: 0 1.35rem;
    border: 1px solid rgba(51, 51, 51, 0.46);
    background: rgba(241, 242, 239, 0.46);
    color: var(--primary-color);
    font-family: var(--menu-font-family);
    font-size: 0.8rem;
    font-weight: 100;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0;
    transition: border-color 0.35s ease, background-color 0.35s ease;

    &:hover,
    &:focus{
      background: rgba(241, 242, 239, 0.74);
      border-color: rgba(51, 51, 51, 0.82);
      color: var(--primary-color);
    }

    @media (max-height: 400px){
      min-height: 2.25rem;
      padding: 0 1rem;
      font-size: 0.72rem;
    }

    @media print {
      display:none;
    }
`

const VariantControl = styled.div`
    position: absolute;
    right: 1.25rem;
    bottom: 1.25rem;
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.45rem 0.5rem 0.45rem 0.65rem;
    background: rgba(241, 242, 239, 0.72);
    border: 1px solid rgba(51, 51, 51, 0.18);
    backdrop-filter: blur(8px);

    @media (max-width: 640px) {
      right: 0.75rem;
      bottom: 0.75rem;
      max-width: calc(100% - 1.5rem);
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    @media print {
      display:none;
    }
`

const VariantField = styled.div`
    display: flex;
    align-items: center;
    gap: 0.35rem;
`

const VariantLabel = styled.label`
    font-family: var(--menu-font-family);
    font-size: 0.72rem;
    line-height: 1;
    color: rgba(51, 51, 51, 0.72);
    text-transform: uppercase;
`

const VariantSelect = styled.select`
    min-height: 2rem;
    max-width: 12rem;
    border: 1px solid rgba(51, 51, 51, 0.24);
    background: rgba(255, 255, 255, 0.64);
    color: var(--primary-color);
    font-family: var(--menu-font-family);
    font-size: 0.78rem;
`

const VariantInput = styled.input`
    width: 4.5rem;
    min-height: 2rem;
    border: 1px solid rgba(51, 51, 51, 0.24);
    background: rgba(255, 255, 255, 0.64);
    color: var(--primary-color);
    font-family: var(--menu-font-family);
    font-size: 0.78rem;
`

const VariantCheckLabel = styled.label`
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    min-height: 2rem;
    font-family: var(--menu-font-family);
    font-size: 0.72rem;
    color: rgba(51, 51, 51, 0.72);
    text-transform: uppercase;
`

const VariantCheck = styled.input`
    width: 1rem;
    height: 1rem;
    margin: 0;
`



