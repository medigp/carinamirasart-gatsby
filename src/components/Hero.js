import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { graphql, useStaticQuery } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import { getTranslatedText } from "./translate/TranslateText"

const Hero = () => {
    const [isStarted, setIsStarted] = useState(false)  
    const [isSmallLoaded, setIsSmallLoaded] = useState(false)
    const [isBigLoaded, setIsBigLoaded] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    
    const { imageReference } = useStaticQuery(
        graphql`
          query {
            imageReference : file(relativePath: {eq: "index-background.jpeg"}){
              id
              image : childImageSharp {
                main : gatsbyImageData(width: 1000, quality: 100, webpOptions: {quality: 100})
                thumb : gatsbyImageData(width: 200, quality: 100, webpOptions: {quality: 100})
              }
            }
          }
        `
      )
    const { image = {} }  = imageReference;
    const { thumb, main } = image
    const bigImage = getImage(main)
    const smallImage = getImage(thumb)

    const title = getTranslatedText('Page.Title')
    const subtitle = getTranslatedText('Page.SubTitle')

    

    useEffect(() => {
      if(isSmallLoaded && isBigLoaded && !isLoaded)
        setIsLoaded(true)
        setTimeout(function(){
          setIsStarted(true)
        }, 500);
    }, [isSmallLoaded, isBigLoaded, isLoaded])

    const onLoadSmallImage = () => {
      setIsSmallLoaded(true)
    }

    const onLoadBigImage = () => {
      setIsBigLoaded(true)
    }

    return (
        <HeroContainer
          className={'transition-element' + (isStarted ? '' : ' not-started') + (isLoaded ? '' : ' not-loaded')}>
            
            <HeroContent>
                <HeroItems>
                    <HeroH1>{title}</HeroH1>
                    <HeroP>{subtitle}</HeroP>
                </HeroItems>
            </HeroContent>
            
            <StyledGatsbyImage
                image={bigImage}
                className={'big-image'}
                alt={title}
                onLoad = {() => { onLoadBigImage() }}
            ></StyledGatsbyImage>
            <StyledGatsbyImage
                image={smallImage}
                className={'small-image'}
                loading="eager"
                alt={title}
                onLoad = {() => { onLoadSmallImage() }}
            ></StyledGatsbyImage>
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
    color: #fff;
    position:relative;
    overflow:hidden;

    &.transition-element{

      h1, p{
        transition: all 0.5s ease-in-out;
      }

      &.not-started{
        h1, p{
          font-size: clamp(0.25rem, 0.75vw, 0.75rem);
        }
      }

      &.not-loaded{
        .small-image{
          opacity:1;
          transform:scale(1.2)
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

const StyledGatsbyImage = styled(GatsbyImage)`
    position: fixed !important;
    top:0;left:0;
    width:100%;height:100%;
    background-attachment: fixed;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;	
    opacity: 1;
    transition: all 0.6s ease-in-out;

    &.big-image{
      z-index:0;

      @media print {
        position:relative !important;
        height:600px;
      }

      @media print and (orientation: landscape){
        height:300px;
      }

    }

    &.small-image{
      z-index:1;
      opacity:0;
      transform: scale(1.2);
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
    color: black;
    line-height: 1.2em;
    text-transform: uppercase;

    @media print {
      text-align: left;
      align-items: left;
    }
`

const HeroH1 = styled.h1`
    display:inline-block;
    margin:0;
    font-size: clamp(1.75rem, 3vw, 2rem);
    font-family:var(--menu-font-family);
    font-weight: 100;
    letter-spacing:0.3em;

    @media print {
      display:none;
    }
`
const HeroP = styled.p`
    display:inline-block;
    font-family:var(--menu-font-family);
    font-size: clamp(0.75rem, 1.5vw, 1.5rem);
    color: white;
    font-weight: 100;
    letter-spacing:0.3em;

    @media print {
      color:black;
    }
`