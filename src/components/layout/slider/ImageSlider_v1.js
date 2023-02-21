import React, { useState } from "react"
import styled from "styled-components"
import { GatsbyImage, getImage } from "gatsby-plugin-image"


const getImageElement = ( img, getThumb = false ) => {
    const{ imageReference } = img
    if(!imageReference)
        return null
    const { main, thumb } = imageReference
    if(getThumb)
        return getImage(thumb)
    return getImage(main)
}


const ImageSlider = ({ paint, displayHorizontally = false}) => {
    const {image_alt_text, main, otherImages} = paint
    const [selectedImage, setSelectedImage] = useState(main);
    
    let images = [ main, ...otherImages ]
    
    const showImageRef = selectedImage
    let showImage = getImageElement(showImageRef, false)
    const classname = displayHorizontally ? 'display-thumbs-horizontally' : 'display-thumbs-vertically'

    const onChangeImage = (thumb) => {
        if(selectedImage.name === thumb.name)
            return;
        setSelectedImage(thumb)
        showImage = getImageElement(selectedImage, false)
    }
    return (
        <SliderWrapper
            className={classname}>
            <MainImageWrapper
                className='image-wrapper'>
                <ImageElement>
                    <GatsbyImage
                        image={showImage}
                        alt={image_alt_text}
                    ></GatsbyImage>
                </ImageElement>
            </MainImageWrapper>
            {images.length > 1 &&
                <ThumbsWrapper
                    className='thumbs-wrapper'>
                {images.map((thumb, index) => (
                    <ThumbElement key={index}
                        onClick={() => onChangeImage(thumb)}
                        className={(selectedImage.name === thumb.name ? 'selected' : '')}>
                        <ThumbImage
                            image={getImageElement(thumb, true)}
                            alt={image_alt_text}
                        ></ThumbImage>
                    </ThumbElement>
                    ))
                }
                </ThumbsWrapper>
            }
        </SliderWrapper>
    )
}

export default ImageSlider

const SliderWrapper = styled.div`
    position: relative;
    display:grid;
    grid-template-columns: auto;
    justify-self: center;
    column-gap: 5px;
    row-gap: 5px;

    transition: all 0.2s ease-in;

    .image-wrapper{
        grid-area: image-wrapper;
        justify-self: stretch;
        align-self: start;
        max-width:500px;
        max-height:800px
    }
    .thumbs-wrapper{
        grid-area: thumbs-wrapper;
        justify-self:start;
        align-self: start;
        width: 100%;
        max-width:500px;
    }

    grid-template-areas : 
        "image-wrapper"
        "thumbs-wrapper";

    &.display-thumbs-horizontally{
        grid-template-areas : 
        "thumbs-wrapper image-wrapper";

        .image-wrapper{}
        .thumbs-wrapper{
            justify-self:end;
            max-height:100%;
            max-width:100px;
            width: auto;
        }
    }
`
const MainImageWrapper = styled.div`
    transition: all 0.2s ease-in;
`

const ImageElement = styled.div`
    transition: all 0.2s ease-in;

    &.hide{
        opacity: 0;
    }
`

const ThumbsWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-end;
    flex-direction:column-reverse;
    gap: 0.5em;
    flex-direction: row;
`

const ThumbElement = styled.div`
    transition: all 0.2s ease-in;

    &:hover,
    &:active,
    &:focus{
        box-shadow: var(--secondary-color) 0px 1px 2px 0px, var(--secondary-color) 0px 1px 3px 1px;
    }
`

const ThumbImage = styled(GatsbyImage)`
    width: 100px;
    height: 100px;
    cursor: pointer;
`