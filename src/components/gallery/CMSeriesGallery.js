import React from "react"
import styled from "styled-components"
import CMSeriesGalleryElement from "./CMSeriesGalleryElement"
import EmptyMessageBlock from "/src/components/layout/messageblock/EmptyMessageBlock"

const CMSeriesGallery = ({list = []}) => {
    if(list.length === 0)
        return (
            <EmptyMessageBlock />
        )
    
    return (
        <CMGalleryContainer>
            {list.map((serie, index) => (
                <CMSeriesGalleryElement
                    key={index}
                    serieInfo={serie}
                    index={index}
                />
            ))}
        </CMGalleryContainer>
    )
}

export default CMSeriesGallery

const CMGalleryContainer = styled.div`
    display:block;
    width:100%;
    padding-top:5em;
`

