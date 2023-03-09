import React from "react"
import styled from 'styled-components'
import Seo from "/src/components/SEO"
import Layout from '/src/components/layout/Layout'
import { getTranslatedText } from "/src/components/translate/TranslateText";
import { graphql } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import MessageBlock from "/src/components/layout/messageblock/MessageBlock"

const About = ({data}) => {
    const { imageReference = {}, pageText = {} } = data
    const {image} = (imageReference || {})
    const { paragraphs = [] } = (pageText || {})
    
    const lang = null
    const title = getTranslatedText('About.title',lang)
    const subtitle = getTranslatedText('About.subtitle', lang)

    const getParagraph = (paragraph, index) => {
      if(!paragraph)
        return "";

      const {text , image} = paragraph

      if(!text && !image)
        return "";

      const definedImage = getImage(image)

      return (
        <Paragraph key={index}>
          {text &&
            <ParagraphText
              dangerouslySetInnerHTML={{__html:text}}
            ></ParagraphText>
          }
          {definedImage &&
            <GatsbyImage
              image={definedImage}
            ></GatsbyImage>
          }
        </Paragraph>
      )

    }

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
    const title = getTranslatedText('About.title',lang)
    return (
      <Seo
          pageId='About'
          title={title}
          image={seoImage}
          keywords={keywords}
          description={description}
      />
    )
}

export const query = graphql`
  query {
    imageReference : file(relativePath: {eq: "about.jpg"}){
      id
      image : childImageSharp {
        gatsbyImageData(width: 500, quality: 90, webpOptions: {quality: 80})
      }
    }
    seoImage : file(relativePath: {eq: "about.jpg"}){
      childImageSharp {
        gatsbyImageData(width: 1200, layout: FIXED)
      }
    }
    pageText(reference : {eq:"about"}){
      seo {
        keywords
        description
      }
      paragraphs {
        text
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
const Paragraph = styled.div`
  
`
const ParagraphText = styled.p`
  
`

export default About;