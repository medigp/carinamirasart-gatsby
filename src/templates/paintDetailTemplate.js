import React from "react"
import { graphql, Link } from "gatsby"
import styled from "styled-components"
import { useMediaQuery } from "react-responsive"
import { DeviceSize } from "/src/data/responsive"
import Layout from '/src/components/layout/Layout'
import Seo from '/src/components/SEO'
import TranslateText from "/src/components/translate/TranslateText";
import BreadCrumbs from '/src/components/layout/breadcrumbs/BreadCrumbs'
import Quote from '/src/components/layout/quote/Quote'
import ImageSlider from '/src/components/layout/slider/ImageSlider'
import CompositionSchema from "/src/components/layout/compositionSchema/CompositionSchema";

const getSerieUrlFromBreadcrumbs = (breadcrumbs, serie) => {
  if(!breadcrumbs || !serie)
    return null

  for(let i = 0; i < breadcrumbs.length; i++){
    if(breadcrumbs[i].text === serie)
      return breadcrumbs[i].url
  }
  return null
}

const PaintTemplate = ({data}) => {
  const { paint } = data
  const { breadcrumbs, title, subtitle, description, body} = paint
  const { sellingData, classification, sizes, quote = {}, image : imageObject = {}, reference} = paint
  const { composition, technique, orientation, serie, style, surface, category, tags } = classification
  const { productState, showProductState, priceEur, priceDollar, showPrice } = (sellingData || {})

  const isMobile = useMediaQuery({ maxWidth : DeviceSize.mobile})

  const showOrientation = false
  const serieUrl = getSerieUrlFromBreadcrumbs(breadcrumbs, serie)

  return (
      <Layout pageTitle={title}>
        <LayoutContentWrapper>
          <BreadCrumbs pagesArray={breadcrumbs}
            pageTitle={title} />
          <Wrapper>
            <LeftWrapper>
                <ImageSlider
                    paint={imageObject}
                    reference={reference}
                    className={'productState-' + productState}
                    displayHorizontally={!isMobile}
                ></ImageSlider>
            </LeftWrapper>
            <RightWrapper>
                <MainTitle
                  className={'info-block-appear'}>{title}</MainTitle>
                {subtitle &&
                  <SubTitle
                    className={'info-block-appear'}>{subtitle}</SubTitle>
                }
                
                {description && 
                  <PaintDescriptionWrapper
                    className={'info-block-appear'}>
                    <Description dangerouslySetInnerHTML={{__html:description}} />
                  </PaintDescriptionWrapper>
                }
                <ListWrapper>
                  <DefinitionsList
                    className={'info-block-appear'}>
                  {serie && serie !== 'Indefinida' && 
                      <>
                        <dt><TranslateText text='Serie' /></dt>
                        <dd>
                          {serieUrl && 
                            <i><StyledLink to={serieUrl}>{serie}</StyledLink></i>
                          }
                          {!serieUrl && 
                            <i>{serie}</i>
                          }
                        </dd>
                      </>
                  }
                
                  {category && 
                    <>
                      <dt><TranslateText text='Category' /></dt>
                      <dd><TranslateText text={category}/></dd>
                    </>
                  }
                  {technique && 
                    <>
                      <dt><TranslateText text='Technique' /></dt>
                      <dd><TranslateText text='Technique.withSurface' dataToReplace ={ [ technique, surface.toLowerCase() ]} translateDataToReplace={true}/></dd>
                    </>
                  }
                  {style && style !== 'Undefined' && 
                    <>
                      <dt><TranslateText text='Style' /></dt>
                      <dd><TranslateText text={style} /></dd>
                    </>
                  }

                  {composition && composition !== 'Single' &&
                    <>
                      <dt><TranslateText text='Composition' /></dt>
                      <dd><TranslateText text={composition} /></dd>
                    </>
                  }
                  {orientation && showOrientation &&
                    <>
                      <dt><TranslateText text='Orientation' /></dt>
                      <dd><TranslateText text={orientation} /></dd>
                    </>
                  }

                  {productState && showProductState &&
                    <>
                      <dt><TranslateText text='Availability' /></dt>
                      <dd><TranslateText text={productState} /></dd>
                    </>
                  }
                  {(showPrice && (priceEur || priceDollar)) &&
                    <>
                      <dt><TranslateText text='Price' /></dt>
                      <dd><TranslateText text='Price.value' dataToReplace = { [priceEur, priceDollar]}/></dd>
                    </>
                  }
                  </DefinitionsList>
                </ListWrapper>     
            </RightWrapper>
          </Wrapper>

          {quote && quote.text && quote.showQuote &&
            <SimpleWrapper
              className={'info-block-appear'}>
              <Quote quote={quote}/>
            </SimpleWrapper>
          }

          {sizes &&
            <SimpleWrapper
              className={'info-block-appear'}>
              <CompositionSchema
                sizes={sizes}
              />
            </SimpleWrapper>
          }
          
          {body && 
              <BodyWrapper
                className={'info-block-appear'}>
                <Description dangerouslySetInnerHTML={{__html:body}} />
              </BodyWrapper>
          }
          
          {tags && false &&
            <TagsWrapper
              className={'info-block-appear'}>
              <div>
                <b>tags:</b> {JSON.stringify(tags)}
              </div>
            </TagsWrapper>
          }
        </LayoutContentWrapper>
      </Layout>
  )
}

export default PaintTemplate

export const Head = ({data, pageContext}) => {
  const { paint } = data
  const { title, url} = paint
  const { seo, image : imageObject = {}} = paint
  const mainImage  = imageObject && imageObject.main && imageObject.main.imageReference && imageObject.main.imageReference.main ? imageObject.main.imageReference.main : {}
  const { seoKeywords, seoDescription, seoImage = mainImage } = seo
  
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

const LayoutContentWrapper = styled.section`
  padding-bottom : 2rem;
  max-width: var(--max-content-width);
  margin:auto;
`

const SimpleWrapper = styled.div`
  position:relative;
  padding: 0;

  display:grid;
  grid-template-columns: 1fr;

  transition: all 0.2s ease-in;

  @media ( min-width : ${DeviceSize.mobile}px ){
    padding: 1rem 0;
    column-gap: 1rem;
  }
`
const Wrapper = styled(SimpleWrapper)`
  @media ( min-width : ${DeviceSize.mobile}px ){
      grid-template-columns: 1fr 1fr;
  }
`

const ListWrapper = styled(SimpleWrapper)`
  @media print {
    break-inside: avoid;
  }
`

const LeftWrapper = styled.div`
  display:flex;
  flex-direction: column;
  text-align:left;
`

const TagsWrapper = styled(SimpleWrapper)`
  text-align: right;
`

const RightWrapper = styled.div`
  display:flex;
  flex-direction: column;
  text-align:left;
  font-size:1rem;
`
const MainTitle = styled.h2`
  margin-bottom: 0.5em;

  @media ( min-width : ${DeviceSize.mobile}px ){
    margin-top:0;
}
`
const SubTitle = styled.h3`
  font-weight: normal;
  margin-top:0;
`

const PaintDescriptionWrapper = styled.div`
  display: block;
  padding: 0.5rem 0rem;
  disabled-margin: 1rem 0;
  disabled-border-left: 5px solid var(--alternative-color);

  @media print {
    display:inline-block;
    page-break-inside: avoid;
    break-inside: avoid;
    border-left: 0;
  }
`

const Description = styled.div`
  font-weight: normal;
  color: #555;
  margin-bottom: 1rem;
`

const StyledLink = styled(Link)`
  color : var(--primary-link-color);
  text-decoration: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease-in 0.1s;

  :hover,
  :active,
  :focus{
      color : var(--primary-link-hover-color)
  }
`

const DefinitionsList = styled.dl`
    display:block;
    flex:1;
    margin-top:0;

    dt, dd{
      padding: 1em 0;
    }

    dt{
      float:left;
      font-weight: bold;
      width: 25%;
      text-align:right;
      clear:both;
    }
    dd{
      float:right;
      width:65%;
      padding-left:10%;
      text-align:left;
      margin:0;
    }

    dd + dd{
      padding-top:0;
    }

    @media print {
      break-inside: avoid;
      page-break-inside: avoid;
    }
`

const BodyWrapper = styled.div`
  padding: 1rem 0;
`

export const query = graphql`
    query PaintTemplate($id: String!) {
      paint(id: {eq: $id}) {
        id
        pageName
        reference
        url
        qrCode
        title
        subtitle
        date
        seo {
          seoKeywords : keywords
          seoDescription : description
          seoImage : image {
            childImageSharp {
              gatsbyImageData(width: 1200, layout : FIXED)
            }
          }
        }
        breadcrumbs {
          text,
          url
        }
        description
        wallLabel {
          title
          subtitle
          description
        }
        body
        image {
          image_alt_text
          main {
            name
            imageReference: childImageSharp {
              main: gatsbyImageData(width: 1000, quality: 100, webpOptions: {quality: 90})
              thumb: gatsbyImageData(width: 100, quality: 70, webpOptions: {quality: 70})
            }
          }
          otherImages {
            name
            imageReference: childImageSharp {
              main: gatsbyImageData(width: 1000, quality: 100, webpOptions: {quality: 90})
              thumb: gatsbyImageData(width: 100, quality: 70, webpOptions: {quality: 70})
            }
          }
        }
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