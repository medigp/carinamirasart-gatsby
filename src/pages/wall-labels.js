import React from "react"
import { graphql } from "gatsby"
import styled from 'styled-components'
import Seo from '/src/components/SEO'
import Layout from '/src/components/layout/Layout'
import BreadCrumbs from '/src/components/layout/breadcrumbs/BreadCrumbs'
import { getTranslatedText } from "/src/components/translate/TranslateText"
import WallLabelSerie from "/src/components/layout/wallLabel/WallLabelSerie"


const WallLabels = ({data}) => {
  const { allPaint, allSerie, site } = data
  const { nodes } = allPaint
  const { nodes : series } = allSerie

  const lang = null
  const title = getTranslatedText('WallLabels.title', lang)
  const breadcrumbs = [ { text : title, url : 'wall-labels' } ]
  
  const getFilteredSeriesByPaints = (paints, series) => {
    let obj = []
    if(!series || !paints)
      return obj
    for(let i = 0; i < paints.length; i++){
      const { classification } = paints[i]
      const { serie } = (classification || {})
      if(obj.indexOf(serie) < 0)
        obj.push(serie)
    }
    return obj
  }

  const getPaintsBySerie = (paints, serieFilter) => {
    let obj = []
    if(!paints || !serieFilter)
      return obj 
    for(let i = 0; i < paints.length; i++){
        const { classification } = paints[i]
        const { serie } = (classification || {})
        if(serie === serieFilter)
          obj.push(paints[i])
    }
    return obj
  }

  const getSeriesAndPaints = (paints, series) => {
    let obj = []
    if(!series || !paints)
      return obj
    for(let i = 0; i < series.length; i++){
      const sPaints = getPaintsBySerie(paints, series[ i ])
      if(sPaints)
        obj[ series[i] ] = sPaints
    }
    return obj
  }

  const getSeriesById = (series) => {
    let obj = {}
    for(let i = 0; i < series.length; i++){
      obj[series[i].serie] = series[i]
    }
    return obj
  }

  const filteredSeries = getFilteredSeriesByPaints(nodes, series)
  const seriesAndPaints = getSeriesAndPaints(nodes, filteredSeries)
  const seriesById = getSeriesById(series)

  return (
        <Layout pageTitle={title}>
            <Seo
              pageId='WallLabels'
              title={title}
            />
            <LayoutContentWrapper>
              <BreadCrumbs pagesArray={breadcrumbs}/>
              <WallLabelsWrapper>
                {
                filteredSeries.map((serieId, index) => (
                  <SerieWrapper
                    key={index}
                  >
                      <WallLabelSerie
                        paints={seriesAndPaints[serieId]}
                        serie={seriesById[serieId]}
                        serieId={serieId}
                        site={site}
                        allowToHide={true}
                        initVisible={false}
                      />
                  </SerieWrapper>
                  ))
                }
              </WallLabelsWrapper>
            </LayoutContentWrapper>
        </Layout>
  )
}

export const Head = ({data, pageContext}) => {
  const { pageText = {}, seoImage = {} } = data
  const { seo = {} } = pageText
  const {description, keywords} = seo
  const lang = null
  const title = getTranslatedText('WallLabels.title',lang)
  return (
    <Seo
        pageId='WallLabels'
        title={title}
        image={seoImage}
        keywords={keywords}
        description={description}
    />
  )
}

export const query = graphql`
query {
  allPaint(sort: [{order: DESC}, {date: DESC}, {title: DESC}]) {
    nodes {
      id
      reference
      pageName
      url
      title
      subtitle
      date
      description
      wallLabelDescription
      body
      quote {
        text
        author
        showQuote
      }
      classification {
        composition
        technique
        surface
        orientation
        serie
        style
        tags
      }
      sellingData {
        priceDollar
        priceEur
        productState
        showPrice
      }
      sizes {
        cm {
          height
          width
          breadth
        }
        inch {
          height
          width
          breadth
        }
      }
    }
  }
  allSerie {
    nodes {
      id
      serie
      hide
      title
      subtitle
    }
  }
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
const WallLabelsWrapper = styled.div`
`
const SerieWrapper = styled.div`

  &.hide-label{
    .paint-wrapper{
      display:block;
    }
  }
`

const LayoutContentWrapper = styled.div`
  max-width: var(--max-content-width);
  margin:auto;
`
export default WallLabels;