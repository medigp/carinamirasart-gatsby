import React from "react"
import { Link } from "gatsby"
import styled from "styled-components"
import { DeviceSize } from "/src/data/responsive"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import { getTranslatedText } from "/src/components/translate/TranslateText";

const MessageBlock = ({image, title, subtitle, text, addDefaultText = false, showLink = false, linkText, linkUrl, fullSize = false}) => {
    const imageRef = getImage(image)

    if(addDefaultText){
        title = title || getTranslatedText('MessageBlock.title')
        subtitle = subtitle || getTranslatedText('MessageBlock.subtitle')
    }

    return (
        <BlockContainer>
            <MessageContainer
                className={(fullSize ? 'full-size' : '')}>
                {imageRef && 
                    <PictureContainer>
                        <StyledGatsbyImage
                            image={imageRef}
                            alt={title}
                        ></StyledGatsbyImage>
                    </PictureContainer>
                }
                {(title || subtitle || text || (showLink && linkText && linkUrl)) &&
                    <TextContainer
                        className={(imageRef ? 'has-image' : '')}>
                        {title && <h1>{title}</h1>}
                        {subtitle && <p>{subtitle}</p>}
                        {text && <p>{text}</p>}

                        {showLink && linkText && linkUrl &&
                            <CLink to={linkUrl}>{linkText}</CLink>
                        }
                    </TextContainer>
                }
            </MessageContainer>
        </BlockContainer>
    )
}

export default MessageBlock

const BlockContainer = styled.div`
    display:flex;
    justify-content: center;
`

const MessageContainer = styled.div`
    display:flex;
    min-width: 300px;
    max-width: 800px;
    justify-content: space-around;
    flex-direction: column;

    &.full-size{
        max-width:100%;
        width:100%;
    }

    @media ( min-width : ${DeviceSize.mobile}px ){
        flex-direction: row;
    }
`

const PictureContainer = styled.div`
    padding: 2rem;
    max-width: 200px;
    max-height: 200px;
    width: 40vw;
    height: 40vw;
    flex:1;
    flex-grow:1;
    margin: auto;
`
const StyledGatsbyImage = styled(GatsbyImage)`
    border-radius: 50%;
    width:100%;
    height:100%;
    transition: all 0.5s ease-in-out;

    :hover{
        transform: scale(1.2);
    }
`

const TextContainer = styled.div`
    padding: 1rem 0;
    flex:1;
    flex-grow:2;

    &.has-image{
        padding: 1rem;
    }

    h1{
        display:block;
        width:100%;
        float: left;
        position:relative;
        font-size:3em;
        margin-bottom:0;
        padding-bottom:5px;
        transition: color 0.5s ease;

        :hover,
        :focus,
        :active{
            color : var(--alternative-color);
        }

        ::after,
        ::before{
            position:absolute;
            display:block;
            content:'';
            width:100%;
            height:5px;
            bottom:0px;
            background:var(--alternative-color);
            z-index:2;
        }
    
        ::before{
            background:var(--secondary-color);
            z-index:3;
            width:0px;
            transition: all 0.2s ease-in 0.1s;
        }
    }

    &:hover h1::before{
        width:100%;
    }

    p{
        color:black;
        width: 100%;
        float:left;
        font-size: 1.5em;
        font-weight: 500;
        margin-top:0;
        padding-top:15px;
        line-height:1.4em;
        position:relative;
        display:block;

        @media ( min-width : ${DeviceSize.mobile}px ){
            float: right;
        }
    }
`

const CLink = styled(Link)`
    display:inline-block;
    text-decoration: none;
    padding-top:2rem;

    color: var(--primary-link-color);
    transition: color 0.5s ease;

    :hover,
    :active{
        color : var(--primary-link-hover-color);
    }
`