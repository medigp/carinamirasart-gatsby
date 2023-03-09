import React from "react"
import styled from "styled-components"
import { DeviceSize } from "/src/data/responsive"
import { getTranslatedText } from "/src/components/translate/TranslateText";
import { FaQuoteLeft, FaQuoteRight } from 'react-icons/fa'

const Quote = ({quote , showLeftIcon = true, showRightIcon = false}) => {
    if(!quote)
        return null
    let { text, author, authorReference } = quote
    if(author === undefined || author.toLowerCase() === 'unknown')
      author = getTranslatedText('Quote.author.Unknown')
    if(!text)
        return null
    return (
        <QuoteContainer>
            <QuoteElement>
                <QuoteText>
                  {showLeftIcon &&
                    <FaQuoteLeft className='quote-icon icon-left'/>
                  }
                  <span dangerouslySetInnerHTML={{__html:text}} />
                  {showRightIcon &&
                    <FaQuoteRight className='quote-icon icon-right'/>
                  }
                </QuoteText>
                {author &&
                    <QuoteAuthor>{author}</QuoteAuthor>
                }
                {authorReference &&
                    <QuoteAuthorReference>{authorReference}</QuoteAuthorReference>
                }
            </QuoteElement>
        </QuoteContainer>
    )
}

export default Quote

const QuoteContainer = styled.div`
  display:flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  font-size: 1.1em;
  position: relative;
 
  @media print {
    page-break-inside: avoid;
    break-inside: avoid;
  }

`

const QuoteElement = styled.figure`
    max-width: 500px;
    font-family: var(--title-font-family);
    font-weight: 400;
    font-style: italic;
    z-index:2;
    position:relative;
    margin: 1em;

    .quote-icon{
      opacity: 0.5;
      font-size: 2em;
      position:absolute;
      
      color: var(--alternative-color);
      transition: all 0.2s ease-in 0.1s;
    }

    .quote-icon.icon-left{
      right:calc(100% + 20px);top:-10px;
    }
    .quote-icon.icon-right{
      left:calc(100% + 20px);bottom:-10px;
    }

    :hover,
    :focus,
    :active{
      blockquote span{
        transform: scale(1.1);
      }

      figcaption::before{
        color:var(--secondary-color);
      }

      .quote-icon{
        color:var(--secondary-color);
      }
    }

    @media ( min-width : ${DeviceSize.mobile}px ){
      margin: auto;

      .quote-icon.icon-left{
        right:calc(100% + 1em);
      }
      .quote-icon.icon-right{
        left:calc(100% + 1em);
      }
    }
  }
`

const QuoteText = styled.blockquote`
  position:relative;
  text-align:left;
  span{
    display:inline-block;
    transition: all 0.2s ease-in;
  }
`
const QuoteAuthor = styled.figcaption`
  text-align: right;
  font-weight: 300;
  position:relative;
  
  ::before{
      content:'-- ';
      font-weight: bold;
      color:var(--alternative-color);
      transition: all 0.2s ease-in 0.1s;
  }
`
const QuoteAuthorReference = styled.figcaption`
  text-align: right;
  font-size: 0.9em;
  font-weight: 100;
`