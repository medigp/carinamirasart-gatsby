import React from "react"
import styled from "styled-components"
import { Link } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"

const CMGalleryElement = ({imageInfo}) => {
    const { title, image : imageObject = {}, url, reference} = imageInfo
    const{ main = {}, image_alt_text = title } = imageObject
    const image = getImage(main.imageReference)
    const gatsbyImageStyle = {"viewTransitionName" : reference + "-paint"}
    return (
        <ElementContainer
            to={url}>
            <PictureContainer>
                <GatsbyImage
                    style={gatsbyImageStyle}
                    image={image}
                    alt={image_alt_text}
                ></GatsbyImage>
            </PictureContainer>
        </ElementContainer>
    )
}

export default CMGalleryElement

const ElementContainer = styled(Link)`
    position:relative;
`

const PictureContainer = styled.div`
    z-index:1;
    position:relative;
    transition: all 0.2s ease-in 0.1s;


    /* Animació */
    animation: gallery-paint-appear ease-out;
    animation-timeline: view();
    animation-range: entry 0px cover max(100px, 20%);

    :hover,
    :active,
    :focus{
        transform: scale(1.02);
    }
`