import React from "react"
import styled from "styled-components"
import { Link } from "gatsby"
import { getImage } from "gatsby-plugin-image"
import MessageBlock from "/src/components/layout/messageblock/MessageBlock"

const CMSeriesGalleryElement = ({serieInfo, index}) => {
    const { url, title, subtitle, cover } = (serieInfo || {})
    const{ main = {} } = cover
    const image = getImage(main)
    return (
        <ElementContainer
            to={url}>
            <MessageBlock
                image={image}
                title={title}
                subtitle={subtitle}
                fullSize={true}
                isList={true}
                indexInList={index}
                alignOnLeft={index % 2 === 0}
            />
        </ElementContainer>
    )
}

export default CMSeriesGalleryElement

const ElementContainer = styled(Link)`
    position:relative;
`