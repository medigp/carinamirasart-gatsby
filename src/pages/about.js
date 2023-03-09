import React from "react"
import styled from 'styled-components'
import { DeviceSize } from "/src/data/responsive"
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
          <IconElement className='p-icon'></IconElement>
          <ParagraphWrapper className='p-wrapper'>
          {text &&            
            <ParagraphText
              dangerouslySetInnerHTML={{__html:text}}
            ></ParagraphText>
          }
          </ParagraphWrapper>
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
  position:relative;
`

const LayoutTextWrapper = styled(LayoutContentWrapper)`
  padding-top:2rem;
`
const Paragraph = styled.div`
  display:flex;
  padding-bottom:3rem;
  position:relative;
  z-index:0;

  .p-icon{
    position:absolute;
    width:10px;
    height:10px;
    border-radius:10px;
    content:'';
    background:white;
    top:1em;
    left:calc(1rem - 6px);
    border:2px solid var(--primary-link-hover-color);
    z-index:3;
    transition: all 0.5s ease;
  }

  &:hover .p-icon{
    border-color: var(--alternative-color);;
    transform:scale(2);
  }

  &::before,
  &::after{
    position:absolute;
    width:0;
    height:100%;
    content:'';
    top:1em;
    left:1rem;
    border:1px dashed var(--primary-link-hover-color);
    xx-border-style:solid;
    z-index:1;
    transition: all 0.5s ease;
  }
  &::after{
    display:none;
    z-index:2;
    height:0;
    border-color:var(--alternative-color);
    transition: all 1s ease-out;
  }
  &:hover::after{
    height:100%;
  }

  &:last-of-type::before,
  &:last-of-type::after{
    display:none;
  }

  div.p-wrapper {
    margin-top:0;
    transform:translateY(-0.5em);
  }

  div.p-wrapper p{
    padding-left: 3rem;
    transition: all 0.5s ease;
  }

  &:hover div.p-wrapper p{
    transform: translateX(-0.5em);
  } 

  @media ( min-width : ${DeviceSize.mobile}px ){
    text-align:right;

    &::before,
    &::after{
      left:50%;
    }
  
    .p-icon{
      left:calc(50% - 6px);
    }
    
    div.p-wrapper {
      width: 50%;
    }
    div.p-wrapper p{
      padding-left:0;
      padding-right: 3rem;
    }

    &:hover div.p-wrapper p{
      transform: translateX(0.5em);
    } 

    &:nth-of-type(2n){
      justify-content: end;
      text-align:left;
      
      div.p-wrapper p{
        padding-left:3rem;
        padding-right: 0;
      }
      &:hover div.p-wrapper p{
        transform: translateX(-0.5em);
      }
    }

  }

`
const ParagraphWrapper = styled.div`

`

const IconElement = styled.div`
`
const ParagraphText = styled.p`
  
`

export default About;