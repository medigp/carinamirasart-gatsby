import React from "react"
import styled from "styled-components"
import CMGalleryElement from "./CMGalleryElement"
import { Masonry } from "masonic"
import EmptyMessageBlock from "/src/components/layout/messageblock/EmptyMessageBlock"

const CMGallery = (props) => {
    const { list = [] } = props;
    if(list.length === 0)
        return (
            <EmptyMessageBlock />
        )
    
    return (
        <CMGalleryContainer>
            <Masonry 
                items={list}
                columnGutter={8}
                columnWidth={250}
                overscanBy={5}
                maxColumnCount={3}
                render={PictureElement}
            />
        </CMGalleryContainer>
    )
}

export default CMGallery

const PictureElement = ( {data, index} ) => {
     return (   
        <CMGalleryElement
            imageInfo={data}
        />
     )
}

const CMGalleryContainer = styled.div`
    display:flex;
`

