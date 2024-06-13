import React from "react"
import { graphql } from "gatsby"
import styled from "styled-components"
import Layout from '/src/components/layout/Layout'
import Seo from '/src/components/SEO'
import BreadCrumbs from '/src/components/layout/breadcrumbs/BreadCrumbs'
import Quote from '/src/components/layout/quote/Quote'
import CMGallery from "/src/components/gallery/CMGallery"
import MessageBlock from "/src/components/layout/messageblock/MessageBlock"
import useIsClient from "/src/components/hooks/useIsClient"

const GalleryTemplate = ({data, pageContext}) => {
  const { serieInfo = {} , allPaint = []} = data
  const { nodes = []} = allPaint
  const { serie : contextSerie , breadcrumbs : contextBreadcrumbs = [] } = pageContext
  const { title = contextSerie, subtitle, description, breadcrumbs = contextBreadcrumbs} = (serieInfo || {})
  const { quote = {}, cover = {} } =  (serieInfo || {})
  const { main : coverImage  = {}} = cover
  
  let { url } = (serieInfo || {})
  if(!url && contextSerie)
    url = '/'+contextSerie.toLowerCase()

  const { text : quoteText } = (quote || {})
  const showSerieDescription = serieInfo && (description || subtitle || quoteText)

  const { isClient } = useIsClient();
  if(!isClient) return null
  return (
        <Layout pageTitle={title}>    
            <LayoutContentWrapper>
              <BreadCrumbs pagesArray={breadcrumbs} 
                pageTitle={title}
                titleAsH1={true} />
              
              <MessageBlock
                    image={coverImage}
                    title={title}
                    subtitle={subtitle}
                    fullSize={true}
                />
              {showSerieDescription && 
                <SerieDescriptionWrapper>
                  {serieInfo.description &&
                    <Description dangerouslySetInnerHTML={{__html:serieInfo.description}} />
                  }
                  {serieInfo.body && 
                    <Description dangerouslySetInnerHTML={{__html:serieInfo.body}} />
                  }
                </SerieDescriptionWrapper>
              }
              { quote && quote.text && quote.showQuote &&
                  <Quote quote={quote} />
              }
            </LayoutContentWrapper>
            <LayoutContentWrapper>
              <CMGallery list={nodes}/>
            </LayoutContentWrapper>
        </Layout>
  )
}

export default GalleryTemplate

const LayoutContentWrapper = styled.div`
  max-width: var(--max-content-width);
  margin:auto;
  padding-bottom : 2rem;
`
const SerieDescriptionWrapper = styled.div`
  display: block;
  /*padding: 0.5rem 1rem;
  margin: 1rem 0;
  border-left: 5px solid var(--alternative-color);*/
`

const Description = styled.div`
  font-weight: normal;
  color: #555;
`
export const Head = ({data, pageContext}) => {
  const { serieInfo = {}, altSeoImages = {}} = data
  const { serie : contextSerie } = pageContext
  const { title = contextSerie, seo = {}} = (serieInfo || {})  
  const { cover = {} } =  (serieInfo || {})
  const { main : coverImage  = {}} = cover
  const { description : seoDescription, keywords : seoKeywords = [] } = seo
  let { seoImage = coverImage } = seo
  if(seoImage === null && altSeoImages && altSeoImages.nodes && altSeoImages.nodes[0] && altSeoImages.nodes[0].seoImage && altSeoImages.nodes[0].seoImage.main && altSeoImages.nodes[0].seoImage.main.imageReference){
    seoImage = altSeoImages.nodes[0].seoImage.main
  }
  let { url } = (serieInfo || {})
  if(!url && contextSerie)
    url = '/'+contextSerie.toLowerCase()

  return (
    <Seo
      title={title}
      description={seoDescription}
      keywords={seoKeywords}
      image={seoImage}
      url={url}
      />
  )
}

export const query = graphql`
query GalleryTemplate($serie: String!) {
  serieInfo: serie(serie: {eq: $serie}) {
    id
    url
    seo {
      seoKeywords: keywords
      seoDescription: description
      seoImage: image {
        childImageSharp {
          gatsbyImageData(width: 1200, layout: FIXED)
        }
      }
    }
    date
    serie
    classification {
      serie
      style
      technique
      composition
      tags
    }
    title
    subtitle
    cover: image {
      main {
        childImageSharp {
          gatsbyImageData(width: 500, quality: 90, webpOptions: {quality: 80})
        }
      }
    }
    description
    body
    quote {
      author
      text
      showQuote
    }
  }
  altSeoImages: allPaint(
    filter: {classification: {serie: {eq: $serie}}}
    sort: [{date: DESC}, {title: DESC}]
    limit: 1
  ) {
    nodes {
      id
      seoImage: image {
        main {
          imageReference: childImageSharp {
            gatsbyImageData(width: 500, quality: 90, webpOptions: {quality: 80})
          }
        }
        image_alt_text
      }
    }
  }
  allPaint(
    filter: {classification: {serie: {eq: $serie}}, hide: {eq: false}}
    sort: [{order: DESC}, {date: DESC}, {title: DESC}]
  ) {
    nodes {
      id
      url
      title
      image {
        main {
          imageReference: childImageSharp {
            gatsbyImageData(width: 500, quality: 90, webpOptions: {quality: 80})
          }
        }
        image_alt_text
      }
    }
  }
}`