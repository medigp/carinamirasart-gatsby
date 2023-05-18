import React from "react"
import styled from 'styled-components'
import { DeviceSize } from "/src/data/responsive"
import Seo from "/src/components/SEO"
import Layout from '/src/components/layout/Layout'
import { getTranslatedText } from "/src/components/translate/TranslateText";
import { graphql } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import MessageBlock from "/src/components/layout/messageblock/MessageBlock"
import useIsClient from "/src/components/hooks/useIsClient"

const Reviews = ({data}) => {
    const { isClient } = useIsClient();

    const { imageReference = {}, pageText = {}} = data
    const {image} = imageReference
    const { paragraphs = [] } = (pageText || {})

    const lang = null
    const title = getTranslatedText('Reviews.title', lang)
    const subtitle = getTranslatedText('Reviews.subtitle', lang)

    const getParagraph = (paragraph, index) => {
      if(!paragraph)
        return "";

      const {text, author, authorTitle, image : pimage} = paragraph
      if(!text)
        return "";

      const definedImage = pimage !== undefined ? getImage(pimage) : null

      return (
        <ReviewContainer key={index}>
          {text &&
            <Review
              className={index % 2 === 0 ? 'align-right' : 'align-left'}
            >
              {author && 
                <ReviewAuthor
                  dangerouslySetInnerHTML={{__html:author}}
                ></ReviewAuthor>
              }
              {authorTitle && 
                <ReviewAuthorTitle
                  dangerouslySetInnerHTML={{__html:authorTitle}}
                ></ReviewAuthorTitle>
              }
              <ReviewText
                dangerouslySetInnerHTML={{__html:text}}
              ></ReviewText>
              
            </Review>
          }
          {definedImage &&
            <StyledGatsbyImage
              image={definedImage}
            ></StyledGatsbyImage>
          }
        </ReviewContainer>
      )

    }

    if( !isClient ) return null
    return (
        <Layout pageTitle={title}>
            <LayoutContentWrapper>
                <MessageBlock
                    image={image}
                    title={title}
                    subtitle={subtitle}
                    fullSize={true}
                />
            </LayoutContentWrapper>

            <LayoutTextWrapper>
                {paragraphs 
                  && paragraphs.map((paragraph, index) => 
                    getParagraph(paragraph, index))
                }
            </LayoutTextWrapper>
        </Layout>
    )
}

export const Head = ({data, pageContext}) => {
  const { pageText = {}, seoImage = {} } = data
  const { seo = {} } = (pageText || {})
  const {description, keywords} = (seo || {})
  const lang = null
  const title = getTranslatedText('Reviews.title',lang)
  return (
    <Seo
        pageId='Reviews'
        title={title}
        image={seoImage}
        keywords={keywords}
        description={description}
    />
  )
}

export const query = graphql`
query {
  imageReference : file(relativePath: {eq: "reviews.jpg"}){
    id
    image : childImageSharp {
      gatsbyImageData(width: 500, quality: 90, webpOptions: {quality: 80})
    }
  }
  seoImage : file(relativePath: {eq: "reviews.jpg"}){
    childImageSharp {
      gatsbyImageData(width: 1200, layout: FIXED)
    }
  }
  pageText(reference : {eq:"reviews"}){
    seo {
      keywords
      description
    }
    paragraphs {
      text,
      author,
      authorTitle
    }

  }
}
`

const LayoutContentWrapper = styled.div`
  max-width: var(--max-content-width);
  margin:auto;
`

const LayoutTextWrapper = styled(LayoutContentWrapper)`
  padding-top:2rem;
`
const ReviewContainer = styled.div`
  display:flex;
  width:100%;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  padding-bottom:6rem;

  @media print {
    page-break-inside: avoid;
    break-inside: avoid;
  }
`
const Review = styled.div`
  min-width:300px;
  clear: both;

  figcaption{
    font-family: var(--title-font-family);
  }

  @media ( min-width : ${DeviceSize.mobile}px ){
    max-width:80%;

    &.align-right{
      text-align:right;
      align-self: flex-end;

      data-gatsby-image-wrapper{
        align-self: flex-end;
      }
    }
    &.align-left{
      text-align:left;
      align-self: flex-start;

      data-gatsby-image-wrapper{
        align-self: flex-start;
      }
    }
  }
`
const ReviewText = styled.div`
  
`
const ReviewAuthor = styled.h2`
  margin-bottom:0;
  transition: color 0.5s ease;

  :hover,
  :focus,
  :active{
      color : var(--alternative-color);
  }
`
const ReviewAuthorTitle = styled.h3`
  font-size: 1.2em;
  font-weight: 100;
  margin-top:0;
  font-style:italic;
`

const StyledGatsbyImage = styled(GatsbyImage)`
  margin-top: 2em;
  margin-bottom: 2em;
`

export default Reviews;