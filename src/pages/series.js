import React from "react"
import styled from 'styled-components'
import Seo from '/src/components/SEO'
import Layout from '/src/components/layout/Layout'
import { graphql } from "gatsby"
import BreadCrumbs from '/src/components/layout/breadcrumbs/BreadCrumbs'
import CMSeriesGallery from "/src/components/gallery/CMSeriesGallery"
import { getTranslatedText } from "/src/components/translate/TranslateText"

const Series = ({data}) => {
  
  const { allSerie } = data
  const { nodes : series } = allSerie

  const { pageText = {}, seoImage = {} } = data
  const { seo = {} } = pageText
  const {description, keywords} = seo
  
  const lang = null
  const breadcrumbs = [ { text : 'Gallery', url : '/gallery' }, { text : 'Series' }  ]
  const title = getTranslatedText('Series', lang)
  return (
        <Layout pageTitle={title}>
            <Seo
              pageId='Series'
              title={title}
              image={seoImage}
              keywords={keywords}
              description={description}
            />
            <LayoutContentWrapper>
              <BreadCrumbs 
                pagesArray={breadcrumbs}
                pageTitle={title}
                titleAsH1={true}/>
              <CMSeriesGallery list={series}/>
            </LayoutContentWrapper>
        </Layout>
  )
}

export const Head = ({data, pageContext}) => {
  const { pageText = {}, seoImage = {} } = data
  const { seo = {} } = pageText
  const { description, keywords } = seo
  const lang = null
  const title = getTranslatedText('Series.title',lang)
  return (
    <Seo
        pageId='Series'
        title={title}
        image={seoImage}
        keywords={keywords}
        description={description}
    />
  )
}

export const query = graphql`
query {
  allSerie (sort: [{date: DESC}, {title: DESC}]) {
    nodes {
      id
      serie
      url
      hide
      title
      subtitle
      description
      date
      cover: image {
        main {
          childImageSharp {
            gatsbyImageData(width: 500, quality: 90, webpOptions: {quality: 80})
          }
        }
      }
    }
  }
}
`

const LayoutContentWrapper = styled.div`
  max-width: var(--max-content-width);
  margin:auto;
`
export default Series;