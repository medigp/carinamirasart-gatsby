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
import { BsLink45Deg } from 'react-icons/bs'

const Press = ({data}) => {
    const { isClient } = useIsClient();

    const { imageReference = {}, pageText = {}} = data
    const { image: fallbackImage } = (imageReference || {})
    const { paragraphs = [], sortParagraphs, title: pageTitle, subtitle: pageSubtitle, image: pageImage } = (pageText || {})
    const image = pageImage?.main?.image || fallbackImage

    const lang = null
    const title = pageTitle || getTranslatedText('Press.title', lang)
    const subtitle = pageSubtitle || getTranslatedText('Press.subtitle', lang)

    const getDateTxt = (date) => {
      if(!date || !date.includes("-"))
        return null;
      let elems = date.split("-");
      if(!elems || elems.length !== 3)
        return null;
      const txt = elems[2] + "/"+ elems[1] + "/" + elems[0];
      return txt;
    };

    const getDate = (date) => {
      if(!date || !date.includes("-"))
        return null;
      let elems = date.split("-");
      if(!elems || elems.length !== 3)
        return null;
      var day = parseInt(elems[2], 10);
      var month = parseInt(elems[1], 10) - 1;
      var year = parseInt(elems[0], 10);
      return new Date(year, month, day);
    };

    const getYearParagraphs = (year, paragraphs) => {
      return (
        <PressYearContainer key={year}>
          <PressYearTitle><span>{year}</span></PressYearTitle>
          <PressYearContent className='py-content'>
            { paragraphs && 
              paragraphs.sort(function(p1,p2){
                  const ascFactor = (sortParagraphs === 'ASC' ? 1 : -1);
                  var d1 = getDate(p1.date);
                  var d2 = getDate(p2.date);
                  return (d1 < d2 ? -1 : 1) * ascFactor;
                }).map((paragraph, index) => 
                  {return getParagraph(paragraph, index)}
                )
            }
          </PressYearContent>
        </PressYearContainer>
      );
    }; 

    const getParagraph = (paragraph, index) => {
      if(!paragraph)
        return "";

      const {text, author, title, link, date, image : pimage} = paragraph
      if(!title)
        return "";

      const definedImage = pimage !== undefined ? getImage(pimage) : null
      const dateTxt = getDateTxt(date);

      return (
        <PressContainer key={index} className='p-content'>
          <PressWrapper
            href={link}
            target="_blank">
            {title && 
              <PressTitle className='p-title'>
                <span
                  dangerouslySetInnerHTML={{__html:title}}></span>
                <IconLink className='p-icon'></IconLink>
              </PressTitle>
            }
            {text &&
            <PressText
              dangerouslySetInnerHTML={{__html:text}}
            ></PressText>
            }
            {author && 
              <PressAuthor
                dangerouslySetInnerHTML={{__html:author}}
              ></PressAuthor>
            }
            {dateTxt && 
              <PressDate
                dangerouslySetInnerHTML={{__html:dateTxt}}
              ></PressDate>
            }
            {link &&
            <PressLink
              dangerouslySetInnerHTML={{__html:link}}
            ></PressLink>
            }
              
            {definedImage &&
              <StyledGatsbyImage
                image={definedImage}
              ></StyledGatsbyImage>
            }
          </PressWrapper>
        </PressContainer>
      )

    }

    if( !isClient ) return null

    let paragraphsMap = {};
    let years = [];
    if(paragraphs && paragraphs.length)
      for(var i = 0; i < paragraphs.length; i++){
        var p = paragraphs[i];
        var date = getDate(p.date);
        var year = date.getFullYear();
        var pm = paragraphsMap[ year ];
        if(!pm){
          pm = [];
          if(!years.includes(year))
            years.push(year);
        }
        pm.push(p);
        paragraphsMap[year] = pm;
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
              {years 
                && years.sort().reverse().map((year, index) => {
                return getYearParagraphs(year, paragraphsMap[ year ]);
              })}
            </LayoutTextWrapper>
        </Layout>
    )
}

export const Head = ({data, pageContext}) => {
  const { pageText = {}, seoImage = {} } = data
  const { seo = {} } = (pageText || {})
  const {description, keywords} = (seo || {})
  const title = pageText?.title || getTranslatedText('Press.title', null)
  const lang = null
  return (
    <Seo
        pageId='Press'
        title={title}
        image={seoImage}
        keywords={keywords}
        description={description}
    />
  )
}

export const query = graphql`
query {
  imageReference : file(relativePath: {eq: "pageTexts/press/press.jpg"}){
    id
    image : childImageSharp {
      gatsbyImageData(width: 500, quality: 90, webpOptions: {quality: 80})
    }
  }
  seoImage : file(relativePath: {eq: "pageTexts/press/press.jpg"}){
    childImageSharp {
      gatsbyImageData(width: 1200, layout: FIXED)
    }
  }
  pageText(reference : { eq: "press" }){
    seo {
      keywords
      description
    }
    title
    subtitle
    image {
      main {
        image: childImageSharp {
          gatsbyImageData(width: 500, quality: 90, webpOptions: {quality: 80})
        }
      }
    }
    paragraphs {
      date,
      title,
      text,
      author,
      link
    }

  }
}
`

const LayoutContentWrapper = styled.div`
  max-width: var(--max-content-width);
  margin:auto;

  @media print {
    font-size: 14px;
  }
`

const LayoutTextWrapper = styled(LayoutContentWrapper)`
  padding-top:2rem;
`
const PressYearContainer = styled.div`
  display: grid;
  grid-template-areas: "year press";
  grid-template-columns: 50px 1fr;

  @media ( min-width : ${DeviceSize.mobile}px ){
    grid-template-columns: 100px 1fr;
  }

  @media print {
    grid-template-areas:  "year"
                          "press";
    grid-template-columns: 1fr;
  }

  &:last-of-type .py-content:last-of-type .p-content:last-of-type::after{
    position:absolute;
    content:'';
    bottom: -1rem;
    width: 22px;
    height: 5px;
    left: -60px;
    background: var(--primary-link-hover-color);
    z-index:3;

    @media ( min-width : ${DeviceSize.mobile}px ){
      left: -10px;
    }
  }
`;
const PressYearTitle = styled.h1`
  margin-top:0;
  position: sticky;
  top: var(--header-height);
  color: var(--alternative-color);
  left: 0;
  align-self: start;
  margin: 0;
  padding-top:15px;

  span{
    transform: rotate(90deg);
    display:inline-block;
  }

  @media print {
    position: relative;
    top: unset;
    padding-left: 0.5em;
  }

  @media ( min-width : ${DeviceSize.mobile}px ){
    span{
      transform: none;
    }
  }
`;
const PressYearContent = styled.div`
  position: relative;
  z-index: 0;  
  
  &::before{
    position:absolute;
    content:'';
    transition: all 0.5s ease;
    top: 2.5rem;
    width:0;
    height:100%;
    left:-50px;
    border:1px dashed var(--primary-link-hover-color);
    z-index:0;

    @media ( min-width : ${DeviceSize.mobile}px ){
      left:0px;
    }
  }

  @media print {
    &::before{
      display:none;
    }
  }
`;
const PressContainer = styled.div`
  padding-bottom:4rem;
  min-width:300px;
  width:100%;
  clear: both;
  
  @media print {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  @media ( min-width : ${DeviceSize.mobile}px ){
    max-width:80%;
  }
`
const PressWrapper = styled.a`
  display:grid;
  text-decoration: none;
  position:relative;
  z-index:0;
  padding-left: 2em;

  grid-template-areas: 
    "author date"
    "title title"
    "text text";
  
  grid-template-columns: repeat(2, 1fr);

  :hover{
    --primary-link-hover-color: var(--primary-link-color);

    .p-title{
      --primary-link-hover-color: var(--alternative-color);
    }
    
    &::before{
      border-color: var(--alternative-color);
      transform:scale(2);
    }
  }
  &:hover .p-icon{
    color: var(--secondary-color);
    transform:scale(1.2);
  }

  &::before{
    position:absolute;
    content:'';
    transition: all 0.5s ease;
    width:10px;
    height:10px;
    border-radius:10px;
    top: 2.5rem;
    left: -56px;
    background:white;
    border:2px solid var(--primary-link-hover-color);
    z-index:0;

    @media ( min-width : ${DeviceSize.mobile}px ){
      left: -6px;
    }

    @media print {
      display:none;
    }

  }

  @media print {
    grid-template-areas: 
    "empty author date"
    "icon title title"
    "icon text text"
    "icon link link";
    grid-template-columns: 50px repeat(2, 1fr);
  }
`;

const IconLink = styled(BsLink45Deg)`
  font-size:0.75em;
  position: relative;
  display:inline-block;
  color: #555;
  padding-left: 5px;
  vertical-align:middle;
  transition: all 0.2s ease-in-out;
`;
const PressText = styled.div`
  grid-area: text;
`;
const PressLink = styled.div`
  grid-area: link;
  font-style: italic;
  color: #555;
  display:none;

  @media print {
    display: block;
  }
`;
const PressTitle = styled.h2`
  grid-area: title;
  margin:0;
  transition: color 0.5s ease;

  :hover,
  :focus,
  :active{
      color : var(--alternative-color);
  }
`
const PressAuthor = styled.div`
  grid-area: author;
  font-size: 0.75em;
  margin:0;
`
const PressDate = styled.div`
  grid-area: date;
  font-size: 0.75em;
  margin:0;
  text-align: right;
`

const StyledGatsbyImage = styled(GatsbyImage)`
  margin-top: 2em;
  margin-bottom: 2em;
`

export default Press;
