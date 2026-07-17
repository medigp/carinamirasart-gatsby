import React, { useEffect, useState } from "react"
import { Link } from "gatsby"
import styled from 'styled-components'
import Layout from '/src/components/layout/Layout'
import Seo from '/src/components/SEO'
import { getTranslatedText } from "/src/components/translate/TranslateText";
import CarinaSignature from "/src/components/themes/icons/CarinaSignature"
import ScratchRevealBackground from "/src/components/ScratchRevealBackground"
import notFoundBackground from "/src/images/404-background.jpeg"

const NotFoundPage = ({ transitionStatus }) => {
  const [isStarted, setIsStarted] = useState(false)
  const title = getTranslatedText('404.Title')
  const subtitle = getTranslatedText('404.Subtitle')
  const linkUrl = "/"
  const linkText = getTranslatedText('Link.goHome')

  useEffect(() => {
    const timeout = setTimeout(function(){
      setIsStarted(true)
    }, 500)

    return () => clearTimeout(timeout)
  }, [])
  
  return (
    <Layout pageTitle={title}
      showFooterIcon={false}>
      <LayoutContentWrapper
        className={'transition-element' + (isStarted ? '' : ' not-started')}>
          <ScratchRevealBackground
            variant="openingImpastoScrape"
            maxAgeSeconds={0}
            maxMarks={0}
            backgroundImage={notFoundBackground}
            showBackgroundTexture={false}
          />
          <ContentWrapper>
            <XLink
              to={linkUrl}
              title={title}>
                <StyledIcon>
                    <CarinaSignature />
                </StyledIcon>
            </XLink>
            {title && 
              <XLink to={linkUrl}>
                <StyledH1>{title}</StyledH1>
              </XLink>}
            {subtitle && 
              <XLink to={linkUrl}>
                <StyledSubtitle>{subtitle}</StyledSubtitle>
              </XLink>
            }
            {linkText &&
              <HeroButtonLink to={linkUrl}>{linkText}</HeroButtonLink>
            }
          </ContentWrapper>
      </LayoutContentWrapper>
  </Layout>
  )
}

export const Head = ({data, pageContext}) => {
  const lang = null
  const title = getTranslatedText('404.Title', lang)
  return (
    <Seo 
      pageId='404'
      title={title}
    />
  )
}

const LayoutContentWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    height: calc(100vh - var(--header-height));
    min-height: 200px;
    min-height: calc(100vh - 100px);
    width: 100%;
    color: var(--primary-color);
    position: relative;
    overflow: hidden;
    isolation: isolate;

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
      flex-direction: column;
      align-items: flex-start;
      max-width: var(--max-content-width);
      margin: auto;
      min-height: auto;
    }
`

const ContentWrapper = styled.div`
    z-index: 3;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 100%;
    max-height: 100%;
    max-width: min(760px, calc(100vw - 3rem));
    padding: 0 calc((100vw - 1300px) / 2);
    color: var(--primary-color);
    line-height: 1.2em;
    position: relative;

    @media (max-height: 400px){
      max-width: min(620px, calc(100vw - 2rem));
      padding: 0 1rem;
    }

    @media print {
      padding: 0;
      height: auto;
      text-align: left;
      align-items: flex-start;
    }
`

const XLink = styled(Link)`
    display: inline-block;
    text-decoration: none;
    color: inherit;
    transition: color 0.5s ease;

    :hover,
    :focus,
    :active{
      color: inherit;
    }
`

const StyledIcon = styled.div`    
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
      display: none;
    }
`

const StyledH1 = styled.h1`
    display: inline-block;
    margin: 0;
    color: var(--primary-color);
    font-size: clamp(1.5rem, 2.5vw, 1.75rem);
    font-family: var(--menu-font-family);
    font-weight: 100;
    letter-spacing: 0;
    text-transform: uppercase;

    @media (max-height: 400px){
      font-size: clamp(1rem, 5vh, 1.35rem);
    }

    @media print {
      display: none;
    }
`

const StyledSubtitle = styled.p`
    display: inline-block;
    margin: 0.8rem 0 1.4rem;
    color: var(--primary-color);
    font-family: var(--menu-font-family);
    font-size: clamp(0.75rem, 1.25vw, 1.1rem);
    font-style: italic;
    font-weight: 100;
    letter-spacing: 0;
    text-transform: none;

    @media (max-height: 400px){
      margin: 0.35rem 0 0.75rem;
      font-size: clamp(0.72rem, 3.6vh, 0.9rem);
    }

    @media print {
      color: black;
    }
`

const HeroButtonLink = styled(Link)`
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
      display: none;
    }
`



export default NotFoundPage
