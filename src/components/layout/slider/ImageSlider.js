import React, { useState, useEffect } from "react"
import styled from "styled-components"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import { DeviceSize } from "/src/data/responsive"
import { IoClose, IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5'
import eventBus from "../../communication/EventBus"
import TranslateText from "../../translate/TranslateText"

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
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImageStyle, setModalImageStyle] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [buttonSimulated, setButtonSimulated] = useState('');
    
    let images = [ main, ...otherImages ]
    images = images.filter((element, index) => {
        if(element)
            return true;
        return false
    })

    useEffect(() => {
        window.addEventListener('keydown', onKeyEvent);
        return () => {
            window.removeEventListener('keydown', onKeyEvent);
        };
    })

    const onKeyEvent = (e) => {
        if(!modalOpen)
            return;
        if(!e || !e.keyCode)
            return
        switch(e.keyCode){
            case 27:
                closeModal()
                break;
            case 39:
                selectNextImage()
                break;
            case 37:
                selectPreviousImage()
                break;
            default:
        }   
    }

    const showImageRef = selectedImage
    let showImage = getImageElement(showImageRef, false)
    //const classname = displayHorizontally ? 'display-thumbs-horizontally' : 'display-thumbs-vertically'
    const classname = 'display-thumbs-vertically'

    const setShowModalDelayed = (value, delay = 100) => {
        setTimeout(function(){
            setShowModal(value)
            eventBus.dispatch("toggleShowMainScroll", !value)
        }, delay)
    }

    const setModalOpenDelayed = (value, delay = 500) => {
        setTimeout(function(){
            setModalOpen(value)
        }, delay)
    }

    const onChangeImage = (thumb) => {
        if(selectedImage === undefined || thumb === undefined || selectedImage.name === thumb.name)
            return;
        setSelectedImage(thumb)
        showImage = getImageElement(selectedImage, false)
    }

    const onClickImage = (image) => {
        openModal()
    }

    const selectNextImage = () => {
        let i = getSelectedImageIndex()
        let newIndex = i < images.length - 1 ? i + 1 : 0
        let newImage = images[ newIndex ]
        simulatedClickOnButton('next')
        onChangeImage(newImage)
        updateModaledStyles(newImage)
    }

    const selectPreviousImage = () => {
        let i = getSelectedImageIndex()
        let newIndex = i === 0 ? images.length - 1 : i - 1
        let newImage = images[ newIndex ] 
        simulatedClickOnButton('previous')
        onChangeImage(newImage)
        updateModaledStyles(newImage)
    }

    const getSelectedImageIndex = () => {
        if(!selectedImage || !images || images.length === 1)
            return 0
        for(let i = 0; i < images.length; i++){
            if(selectedImage.name !== images[i].name)
                continue
            return i
        }
        return 0
    }

    const openModal = () => {
        setModalOpen(true);
        setShowModalDelayed(true)
        eventBus.dispatch("toggleShowMainScroll", false)
        updateModaledStyles();
    }

    const updateModaledStyles = (image) => {
        let style = {};
        //console.log("updateModaledStyles", selectedImage)
        image = image || selectedImage
        if(image){
            const { imageReference = {} } = image
            let { main = {} } = imageReference
            let { width, height } = main
            if(width && height){
                const maxWidth = 900

                if(width > maxWidth){
                    const factor = maxWidth / width
                    height = height * factor
                    width = maxWidth
                }

                style = { 
                            'width' : ''+width + 'px',
                            'height' : ''+height + 'px'
                        }
            }
        }
        setModalImageStyle(style);
    }

    const closeModal = () => {
        simulatedClickOnButton('close')
        setModalOpenDelayed(false, 1000)
        setShowModalDelayed(false, 500)
    }

    const simulatedClickOnButton = (value) => {
        setButtonSimulated(value)
        setTimeout(function(){
            setButtonSimulated('')
        }, 500)
    }

    return (
        <GeneralWrapper>
            <SliderWrapper
                className={classname}>


                <ModaledImageWrapper
                    className={(modalOpen ? 'opened' : '') + (showModal ? ' show-element' : '')}
                    >
                    <ModaledImageElement
                        style={ modalImageStyle }>
                        <ModaledNavWrapper>
                            <ModaledTitle>
                                {image_alt_text}
                            </ModaledTitle>
                            <ModaledButton>
                                <StyledIcon
                                    className={'previous-icon'+(buttonSimulated === 'previous' ? ' active' : '')}
                                    onClick={() => selectPreviousImage() }
                                >
                                    <IoChevronBackOutline />
                                </StyledIcon>
                                <StyledIcon
                                    className={'next-icon'+(buttonSimulated === 'next' ? ' active' : '')}
                                    onClick={() => selectNextImage() }
                                >
                                    <IoChevronForwardOutline />
                                </StyledIcon>
                                <StyledIcon
                                    className={'close-icon'+(buttonSimulated === 'close' ? ' active' : '')}
                                    onClick={() => closeModal() }
                                >
                                    <IoClose />
                                </StyledIcon>
                                <FullSizeButton
                                    className='full-size-close-button'
                                    onClick={() => closeModal() }
                                ></FullSizeButton>
                            </ModaledButton>
                        </ModaledNavWrapper>
                        <GatsbyImage
                            image={showImage}
                            alt={image_alt_text || ''}
                            onClick={() => selectNextImage() }
                        >
                        </GatsbyImage>
                        <ModaledAuthorBlock>
                            <TranslateText text='Paint.copyright' />
                        </ModaledAuthorBlock>
                    </ModaledImageElement>
                </ModaledImageWrapper>


                <MainImageWrapper
                    className='image-wrapper'>
                    <ImageElement
                        onClick={() => onClickImage(showImage)}
                        >
                        <StyledGatsbyImage
                            image={showImage}
                            alt={image_alt_text}
                            objectFit="contain"
                            imgStyle={{ objectFit: "contain" }}
                        ></StyledGatsbyImage>
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
        </GeneralWrapper>
    )
}

export default ImageSlider

const GeneralWrapper = styled.div`
`
const ModaledImageWrapper = styled.div`
    display:none;
    z-index:200;
    opacity:0;
    position: fixed;
    top:0;
    left:0;
    background:transparent;
    overflow: auto;
    width: 100vw;
    height: 100vh;

    justify-content:center;
    align-content:center;

    transition: all 0.2s ease-in;

    &.opened{
        display:flex;
    }

    &.show-element{
        opacity:1;
        background:white;
    }
`

const ModaledImageElement = styled.div`
    position:relative;
    padding:30px;
`

const ModaledNavWrapper = styled.nav`
    position:absolute;
    top:0;
    left:0;
    width: 100%;
    line-height:30px;
    height:30px;
    z-index:3;
    
    @media print {
        position:relative;
    }

    @media ( max-width : ${DeviceSize.mobile}px ){
        height:100vh;
        position:fixed;
    }
`

const ModaledTitle = styled.h2`
    display:none;
    padding-left:30px;

    @media print {
        display:block;
    }
`

const ModaledButton = styled.div`
    position:absolute;
    top:0;
    right:0;
    z-index:3;
    height:30px;

    @media ( max-width : ${DeviceSize.mobile}px ){
        width: 100%;
        height:100%;
    }

    @media print {
        display:none;
    }
`
const FullSizeButton = styled.div`
    display:block;
    z-index:2;
    position:absolute;
    top:0;
    left:0;
    width:100%;
    height:100%;
    cursor:pointer;
    background:transparent;

    @media ( max-width : ${DeviceSize.mobile}px ){
        display:block;
    }
`

const ModaledAuthorBlock = styled.div`
    text-align:right;
    font-style: italic;
    opacity: 0;
    @media print {
        opacity: 1;
    }
`

const StyledIcon = styled.span`
    display: block;
    position:relative;
    float:left;
    cursor: pointer;
    width:30px;
    height:30px;
    line-height:30px;
    vertical-align:center;
    text-align: center;
    background:white;
    font-size:0.8em;
    color: var(--primary-link-color);
    transition: all 0.5s ease;
    z-index:3;

    :hover,
    :active,
    :focus,
    &.active{
        color : white;
        background : var(--primary-link-hover-color);
        font-size:1.2em;
        height:50px;
        width:50px;
        line-height:50px;
    }


    @media ( max-width : ${DeviceSize.mobile}px ){
        font-size:2rem;
        opacity:0.25;
        position:absolute;
        float:none;
        width: 80px;
        height: 80px;
        line-height:80px;
        
        display:flex;
        flex-flow:colum;
        justify-content: center;
        align-items: center;

        background: transparent;
        
        &.previous-icon,
        &.next-icon{
            position:absolute;
            top:calc(50% - 40px);
        }
        &.previous-icon{
            left:-20px;
            //border-radius: 0 40px 40px 0;
        }
        &.next-icon{
            left:auto;
            right:-20px;
            //border-radius: 40px 0 0 40px;
        }

        &.close-icon{
            top:-20px;
            right:-20px;
            height:80px;
            line-height: 80px;
            z-index:4;
            //border-radius: 0 0 0 40px;
        }

        :hover,
        :active,
        :focus,
        &.active{
            font-size:3rem;
            opacity:1;
            width: 80px;
            height: 80px;
            line-height:80px;

            &.previous-icon{
                left:0px;
            }

            &.next-icon{
                right:0px;
            }
            &.close-icon{
                top: 0px;
                right:0px;
            }
        }
    }
`

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

        @media print {
            page-break-inside: avoid;
            break-inside: avoid;
            overflow:hidden;
            max-height:400px;
        }

        @media print and (orientation: landscape){
            page-break-inside: avoid;
            break-inside: avoid;
            overflow:hidden;
            max-height:300px;

            * {
                max-height:300px !important;
            }
        }
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
        "thumbs-wrapper image-wrapper"
        "thumbs-wrapper thumbs-wrapper";

        .image-wrapper{}
        .thumbs-wrapper{
            justify-self:end;
            max-height:600px;
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
    height:auto;
    width: auto;

    &.hide{
        opacity: 0;
    }
`

const StyledGatsbyImage = styled(GatsbyImage)`
    max-height: min(600px, 100vh);
    transition: all 0.2s ease-in;
    cursor: pointer;
`

const ThumbsWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-end;
    flex-direction:column-reverse;
    gap: 0.5em;
    flex-direction: row;
    /*max-height: 600px;*/
    overflow: auto;
    z-index:1;
    padding: 5px;

    @media print {
        break-inside: avoid;
    }
`

const ThumbElement = styled.div`
    transition: all 0.2s ease-in;
    cursor:pointer;
    border:3px solid transparent;
    position:relative;

    ::before{
        position:absolute;
        display:block;
        content:'';
        width:0;
        height:3px;
        top:100%;
        left: 0;
        background:var(--primary-link-hover-color);
        z-index:2;
        transition: all 0.2s ease-in 0.1s;
    }

    &:hover,
    &:active,
    &:focus{
        transform: scale(1.05);

        ::before{
            width:100%;
        }
    }

    &.selected{
        border-color: var(--secondary-color);
    }

    @media print {
        break-inside: avoid;
        page-break-inside: avoid;
    }
`

const ThumbImage = styled(GatsbyImage)`
    width: 80px;
    height: 80px;
    cursor: pointer;

    @media print {
        break-inside: avoid;
        page-break-inside: avoid;
    }
`