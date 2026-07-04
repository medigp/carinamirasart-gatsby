import React from "react"
import styled from "styled-components"
import { Link } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import R2Image from "../images/R2Image"
import { getR2WorkImage } from "../../data/r2Assets"

const CMGalleryElement = ({imageInfo}) => {
    const { title, image : imageObject = {}, url, reference} = imageInfo
    const{ main = {}, image_alt_text = title } = imageObject
    const image = getImage(main.imageReference)
    const r2Image = getR2WorkImage(reference, main.name)
    const gatsbyImageStyle = {"viewTransitionName" : reference + "-paint"}
    return (
        <ElementContainer
            to={url}>
            <PictureContainer>
                {r2Image ? (
                    <R2Image
                        style={gatsbyImageStyle}
                        asset={r2Image}
                        alt={image_alt_text}
                    />
                ) : (
                    <GatsbyImage
                        style={gatsbyImageStyle}
                        image={image}
                        alt={image_alt_text}
                    ></GatsbyImage>
                )}
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
