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
    const { paragraphs = [], sortParagraphs } = (pageText || {})
    
    const lang = null
    const title = getTranslatedText('About.title',lang)
    const subtitle = getTranslatedText('About.subtitle', lang)

    const chronologyTitle = getTranslatedText('Chronology',lang)

    const getParagraph = (paragraph, index) => {
      if(!paragraph)
        return "";

      const {title, subtitle, text , image} = paragraph
      if(!text && !image)
        return "";

      const definedImage = getImage(image)

      return (
        <Paragraph key={index}>
          <ParagraphTitle
            className='p-title'>
            <ParagraphH3 
              dangerouslySetInnerHTML={{__html:(title || "Títol")}}
            ></ParagraphH3>
            {subtitle &&
              <ParagraphH4
                dangerouslySetInnerHTML={{__html:(subtitle)}}
              ></ParagraphH4>
            }
          </ParagraphTitle>
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
                <ChronologyTitle>{chronologyTitle}</ChronologyTitle>
                {paragraphs 
                  && paragraphs.sort(function(p1,p2){
                      const ascFactor = (sortParagraphs === 'ASC' ? 1 : -1);
                      return (p1.sortText < p2.sortText ? -1 : 1) * ascFactor;
                    }).map((paragraph, index) => 
                      getParagraph(paragraph, index)
                    )
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
        title
        subtitle
        text
        sortText
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
  display:grid;
  grid-template-columns: 1fr;
  grid-template-areas : 
    "title"
    "text";
  padding: 1.5rem 0;
  position:relative;
  z-index:0;

  h3, h4{ 
    transition: all 0.5s ease;
    padding-left: 3rem;
    line-height: 2rem;
    margin:0;
  }

  h3{ 
    color: var(--alternative-color);
  }

  &:hover h3{
    font-size: 2rem;
  }

  h4{ 
    color: var(--primary-color);
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }
  &:hover h4{
    font-size: 1.2rem;
  }

  .p-icon{
    position:absolute;
    width:10px;
    height:10px;
    border-radius:10px;
    content:'';
    background:white;
    top:calc(1.5rem + 0.5rem);
    left:calc(1rem - 6px);
    border:2px solid var(--primary-link-hover-color);
    z-index:3;
    transition: all 0.5s ease;
  }

  &:hover .p-icon{
    border-color: var(--alternative-color);
    transform:scale(2);
  }

  &::before{
    position:absolute;
    width:0;
    height:100%;
    content:'';
    top:2rem;
    left:1rem;
    border:1px dashed var(--primary-link-hover-color);
    z-index:1;
    transition: all 0.5s ease;
  }

  &:last-of-type::before{
    display:none;
  }

  div.p-wrapper {
    margin: 0;
  }

  div.p-wrapper p{
    padding-left: 3rem;
    margin-top:0;
    transition: all 0.5s ease;
  }

  &:hover div.p-wrapper p{
    transform: translateX(-0.5em);
  } 

  @media ( min-width : ${DeviceSize.mobile}px ){
    grid-template-columns: 1fr 1fr;
    grid-template-areas : "title text";
    padding: 5rem 0;

    &:nth-of-type(2n){
      grid-template-areas : "text title";
    }

    &::before{
      top:0;
      left:50%;
    }

    &:first-of-type::before{
      top: 50%;
      height: 50%;
    }

    &:last-of-type::before{
      display:block;
      top:0;
      height: 50%;
    }

    .p-icon{
      left:calc(50% - 6px);
      top: calc(50% - 6px);
    }

    .p-wrapper,
    .p-title{
      display:flex;
      align-items: center; 
      justify-content: center;
      text-align:center;
      flex-direction:column;
    }

    .p-title{
      flex-direction:columnreverse;
    }

    .p-wrapper p,
    .p-title h3,
    .p-title h4{
      max-width: 80%;
    }
    
    div.p-wrapper p{
      padding:0;
      text-align:left;
    }

    &:nth-of-type(2n){
      div.p-wrapper p{
        text-align:right;
      }
    }
    
    &:hover div.p-wrapper p{
      transform: translateX(-0.5em);
    }

    &:nth-of-type(2n){    
      &:hover div.p-wrapper p{
        transform: translateX(+0.5em);
      }
    }

    h3{
      opacity:0.25;
      font-size:8rem;
      line-height: 8rem;
      vertical-align:top;
      margin:0;
      padding: 0;
    }

    &:hover h3{
      opacity: 0.75;
      font-size:8rem;
      transform:scale(1.2);
    }
    h4{
      margin:0;
      padding: 0;
    }
  }

`

const ChronologyTitle = styled.h2`
  @media ( min-width : ${DeviceSize.mobile}px ){
    text-align: center;
  }
`

const ParagraphTitle = styled.div`
  grid-area : title;
  xx-overflow:hidden;
`
const ParagraphH3 = styled.h3`
`

const ParagraphH4 = styled.h4`
  margin:0;
`

const ParagraphWrapper = styled.div`

`

const IconElement = styled.div`
`
const ParagraphText = styled.p`
  grid-area : text;
`

export default About;