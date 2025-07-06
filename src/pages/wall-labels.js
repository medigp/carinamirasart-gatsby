import React, { useState } from "react"
import { graphql } from "gatsby"
import styled from 'styled-components'
import { DeviceSize } from "/src/data/responsive"
import Seo from '/src/components/SEO'
import Layout from '/src/components/layout/Layout'
import BreadCrumbs from '/src/components/layout/breadcrumbs/BreadCrumbs'
import { getTranslatedText } from "/src/components/translate/TranslateText"
import WallLabelSerie from "/src/components/layout/wallLabel/WallLabelSerie"


const WallLabels = ({data}) => {
  const [ imageFileType, setImageFileType ] = useState('png')
  const [ showQRCode, setShowQRCode ] = useState(true)
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
  const fileTypeLabel = getTranslatedText('File.type')
  const qrLabel = getTranslatedText('Show.QR')

  return (
        <Layout pageTitle={title}>
            <Seo
              pageId='WallLabels'
              title={title}
              follow={false}
            />
            <LayoutContentWrapper>
              <BreadCrumbs pagesArray={breadcrumbs}/>
              <WallLabelsWrapper>
                <ImageExtensionsWrapper>
                  <ImageExtensionsList>
                    <ImageExtensionLabel>
                        {fileTypeLabel}
                    </ImageExtensionLabel>
                    <ImageExtension
                      onClick={() => { setImageFileType('png')} }
                      className={imageFileType === 'png' ? 'selected' : ''}
                    >
                      PNG
                    </ImageExtension>
                    <ImageExtension
                      onClick={() => { setImageFileType('jpg')} }
                      className={imageFileType === 'jpg' ? 'selected' : ''}
                    >
                      JPG
                    </ImageExtension>
                  </ImageExtensionsList>
                </ImageExtensionsWrapper>
                
                <ImageExtensionsWrapper>
                  <ImageExtensionsList>
                    <ImageExtensionLabel>
                        {qrLabel}
                    </ImageExtensionLabel>
                    <ImageExtension
                      onClick={() => { setShowQRCode(true)} }
                      className={showQRCode ? 'selected' : ''}
                    >
                      ON
                    </ImageExtension>
                    <ImageExtension
                      onClick={() => { setShowQRCode(false)} }
                      className={!showQRCode ? 'selected' : ''}
                    >
                      OFF
                    </ImageExtension>
                  </ImageExtensionsList>
                </ImageExtensionsWrapper>
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
                        imageFileType={imageFileType}
                        showQRCode={showQRCode}
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
      qrCode
      title
      subtitle
      date
      description
      wallLabel {
        title
        subtitle
        description
      }
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
      pageName
      reference
      hide
      title
      subtitle
      url
      qrCode
      wallLabel {
        title
        subtitle
        description
      }
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
const WallLabelsWrapper = styled.div``
const SerieWrapper = styled.div`

  &.hide-label{
    .paint-wrapper{
      display:block;
    }
  }
`
const ImageExtensionsWrapper = styled.div`
  position:relative;
  text-align:right;
`
const ImageExtensionsList = styled.div`
  display:inline-block;
  height:30px;
  line-height: 30px;
  overflow: hidden;
  z-index:10;

  @media print {
      display:none;
  }

  @media ( max-width : ${DeviceSize.mobile}px ){
      position:relative;
      text-align:right;
  }
`
const ImageExtensionLabel = styled.div`
  display:inline-block;
  position:relative;
  padding: 0 5px;
  margin-right:10px;
  font-weight:bold;
`
const ImageExtension = styled.div`
    display:inline-block;
    position:relative;
    padding: 0 5px;
    color: var(--primary-link-color);
    transition: all 0.2s ease-in;
    cursor: pointer;

    ::before{
        position:absolute;
        display:block;
        content:'';
        width:0px;
        height:3px;
        bottom:0px;
        left:0;
        background:var(--primary-link-hover-color);
        z-index:2;
        transition: all 0.2s ease-in 0.1s;
    }

    :not(.selected):hover{
        ::before{    
            z-index:3;
            width:100%;
        }
    }

    &.selected{
        color : var(--primary-link-hover-color);
    }

`

const LayoutContentWrapper = styled.div`
  max-width: var(--max-content-width);
  margin:auto;
`
export default WallLabels;