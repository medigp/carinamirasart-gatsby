import React from "react"
import { Link } from "gatsby"
import styled from 'styled-components'
import Layout from '/src/components/layout/Layout'
import Seo from '/src/components/SEO'
import { getTranslatedText } from "/src/components/translate/TranslateText";
import CarinaSignature from "/src/components/themes/icons/CarinaSignature"

const NotFoundPage = ({ transitionStatus }) => {
  const title = getTranslatedText('404.Title')
  const subtitle = getTranslatedText('404.Subtitle')
  const linkUrl = "/"
  const linkText = getTranslatedText('Link.goHome')
  
  return (
    <Layout pageTitle={title}
      showFooterIcon={false}>
      <LayoutContentWrapper>

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
              <XLink to={linkUrl}>
                <StyledGoHome>{linkText}</StyledGoHome>
              </XLink>
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
  max-width: var(--max-content-width);
  margin:auto;
  min-height: 100vh;
  display:flex;
  justify-content: center;
`

const ContentWrapper = styled.div`
  display:flex;
  min-width: 300px;
  max-width: 800px;
  justify-content: space-around;
  flex-direction: column;
  text-align:center;
`

const XLink = styled(Link)`
    display:inline-block;
    text-decoration: none;

    color: var(--primary-link-color);
    transition: color 0.5s ease;

    :hover,
    :focus,
    :active{
        color : var(--primary-link-hover-color);
    }
`

const StyledIcon = styled(Link)`    
    font-size:16em;
    line-height: 1em;
`

const StyledH1 = styled.h1`
    margin-top: 0;
    text-transform:uppercase;
`

const StyledSubtitle = styled.p`
    font-style:italic;
`

const StyledGoHome = styled.div`
    padding-top: 2rem;
`



export default NotFoundPage
