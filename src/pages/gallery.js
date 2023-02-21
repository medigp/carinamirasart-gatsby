import React from "react"
import styled from 'styled-components'
import Seo from '../components/SEO'
import Layout from '../components/layout/Layout'
import { useStaticQuery, graphql } from "gatsby"
import BreadCrumbs from '../components/layout/breadcrumbs/BreadCrumbs'
import CMGallery from "../components/gallery/CMGallery"
import { getTranslatedText } from "../components/translate/TranslateText"

const Gallery = ({ transitionStatus }) => {
  
    const { allPaint, allSerie } = useStaticQuery(
        graphql`
          query {
            allPaint( 
              sort: {order: [DESC, DESC, DESC], fields: [order, date, title]} 
            ) {
              nodes {
                id
                url
                title
                hide
                image {
                  main {
                    imageReference: childImageSharp {
                      gatsbyImageData(width: 500, quality: 90, webpOptions: {quality: 80})
                    }
                  }
                  image_alt_text
                }
                classification {
                  serie
                  composition
                  technique
                  style
                  tags
                }
              }
            }
            allSerie{
              nodes{
                id
                serie
                hide
              }
            }
          }
        `
      )
  const { nodes } = allPaint
  const { nodes : series } = allSerie

  const getFilteredNodes = (nodes, series) => {
    let ret = []
    // TODO: fer un filtrat pel hidden de les series hide
    if(nodes === undefined || nodes.length === 0)
      return ret;
    for(let i = 0; i < nodes.length; i++){
      const { classification , hide} = nodes[i]
      if(!classification || hide)
        continue;
      const{ serie } = classification
      if(!isSerieHidden(series, serie))
        ret.push(nodes[i])
    }
    return ret;
  }

  const isSerieHidden = (list, serie) =>{
    if(list === undefined || list.length === 0)
      return false

    for(let i = 0; i < list.length; i++){
      const {hide, serie: lSerie} = list[i]
      if(serie === lSerie)
        return hide
    }
    return false
  }

  const lang = null
  const paints = getFilteredNodes(nodes, series)
  const breadcrumbs = [ { text : 'Gallery', url : 'gallery' } ]
  const title = getTranslatedText('Gallery.title', lang)
  return (
        <Layout pageTitle={title}>
            <Seo
              pageId='Gallery'
              title={title}
            />
            <LayoutContentWrapper>
              <BreadCrumbs pagesArray={breadcrumbs}/>
              <CMGallery list={paints}/>
            </LayoutContentWrapper>
        </Layout>
  )
}

const LayoutContentWrapper = styled.div`
  max-width: var(--max-content-width);
  margin:auto;
`
export default Gallery;