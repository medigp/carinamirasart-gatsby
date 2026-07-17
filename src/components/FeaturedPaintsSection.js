import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import TranslateText from './translate/TranslateText'
import { Link } from 'gatsby'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import R2Image from './images/R2Image'
import { getR2WorkImage } from '../data/r2Assets'
import { IoChevronBackOutline, IoChevronForwardOutline, IoArrowForward } from 'react-icons/io5'

const FeaturedPaintsSection = ({title, paints = [], galleryBackgroundPaint = null, avoidTranslateTitle = false}) => {
  const visiblePaints = paints.filter(Boolean)
  const listRef = useRef(null)
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, pointerId: null })
  const dragIntentRef = useRef(null)
  const hasDraggedRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)

  if (visiblePaints.length === 0) {
    return null
  }
  
  let displayPaints = visiblePaints
  if(galleryBackgroundPaint == null){
    galleryBackgroundPaint = visiblePaints[visiblePaints.length - 1] || null
    displayPaints = visiblePaints.slice(0, -1)
  }

  const scrollList = (direction) => {
    if (!listRef.current) {
      return
    }

    const item = listRef.current.querySelector('[data-carousel-item="true"]')
    const distance = item ? item.getBoundingClientRect().width + 16 : listRef.current.clientWidth * 0.75

    listRef.current.scrollBy({
      left: direction * distance,
      behavior: 'smooth',
    })
  }

  const onPointerDown = (event) => {
    if (event.pointerType !== 'mouse' || !listRef.current) {
      return
    }

    setIsDragging(true)
    setHasDragged(false)
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: listRef.current.scrollLeft,
      pointerId: event.pointerId,
    }
    dragIntentRef.current = null
    hasDraggedRef.current = false
  }

  const onPointerMove = (event) => {
    if (!isDragging || !listRef.current) {
      return
    }

    const deltaX = event.clientX - dragStartRef.current.x
    const deltaY = event.clientY - dragStartRef.current.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (!dragIntentRef.current) {
      if (Math.max(absX, absY) < 6) {
        return
      }

      dragIntentRef.current = absX > absY ? 'horizontal' : 'vertical'
    }

    if (dragIntentRef.current === 'vertical') {
      setIsDragging(false)
      dragIntentRef.current = null
      return
    }

    if (event.cancelable) {
      event.preventDefault()
    }

    if (event.currentTarget.setPointerCapture && event.pointerId !== undefined) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    if (absX > 4) {
      hasDraggedRef.current = true
      setHasDragged(true)
    }

    listRef.current.scrollLeft = dragStartRef.current.scrollLeft - deltaX
  }

  const stopDragging = (event) => {
    if (
      event?.currentTarget?.releasePointerCapture &&
      dragStartRef.current.pointerId !== null &&
      event.currentTarget.hasPointerCapture?.(dragStartRef.current.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(dragStartRef.current.pointerId)
    }

    setIsDragging(false)
    dragIntentRef.current = null
  }

  const onCardClick = (event) => {
    if (hasDragged || hasDraggedRef.current) {
      event.preventDefault()
    }
  }
  return (
    <Section aria-label={title}>
      <SectionHeader>
        {title &&
          <StyledH1><TranslateText text={title} avoidTranslate={avoidTranslateTitle}/></StyledH1>
        }
        <CarouselControls aria-label="Controls de carrusel">
          <CarouselButton type="button" onClick={() => scrollList(-1)} aria-label="Obres anteriors">
            <IoChevronBackOutline />
          </CarouselButton>
          <CarouselButton type="button" onClick={() => scrollList(1)} aria-label="Obres següents">
            <IoChevronForwardOutline />
          </CarouselButton>
        </CarouselControls>
      </SectionHeader>
      <PaintList
        ref={listRef}
        $isDragging={isDragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={stopDragging}
      >
        {displayPaints.map((paint) => (
          <FeaturedPaintCard
            key={paint.id || paint.reference}
            paint={paint}
            onClick={onCardClick}
          />
        ))}
        <GalleryMoreCard paint={galleryBackgroundPaint} onClick={onCardClick} />
      </PaintList>
    </Section>
  )
}

const FeaturedPaintCard = ({paint, onClick}) => {
  const { title, image: imageObject = {}, url, reference } = paint
  const { main = {}, image_alt_text = title } = imageObject
  const image = getImage(main.imageReference)
  const r2Image = getR2WorkImage(reference, main.name, true)

  if (!url || (!image && !r2Image)) {
    return null
  }

  return (
    <PaintLink to={url} aria-label={title} data-carousel-item="true" onClick={onClick}>
      <PaintImage>
        {r2Image ? (
          <R2Image
            asset={r2Image}
            alt={image_alt_text}
          />
        ) : (
          <GatsbyImage
            image={image}
            alt={image_alt_text}
          />
        )}
      </PaintImage>
      <PaintName>{title}</PaintName>
    </PaintLink>
  )
}

const GalleryMoreCard = ({ paint, onClick }) => {
  const { title = 'Galeria', image: imageObject = {}, reference } = paint || {}
  const { main = {}, image_alt_text = title } = imageObject
  const image = getImage(main.imageReference)
  const r2Image = getR2WorkImage(reference, main.name, true)

  return (
    <MoreLink to="/gallery" data-carousel-item="true" onClick={onClick} aria-label="Veure mes obres a la galeria">
      <SeeMoreCard>
        {r2Image ? (
          <R2Image
            asset={r2Image}
            alt={image_alt_text}
          />
        ) : image ? (
          <GatsbyImage
            image={image}
            alt={image_alt_text}
          />
        ) : null}
        <SeeMoreOverlay>
          <GalleryButton className="gallery-button">
            <TranslateText text="Show.more"/>
          </GalleryButton>
        </SeeMoreOverlay>
      </SeeMoreCard>
      <SeeMoreBlock>
        <MoreText><TranslateText text="Gallery"/></MoreText>
        <MoreIcon className="more-icon">
          <IoArrowForward />
        </MoreIcon>
      </SeeMoreBlock>
    </MoreLink>
  )
}

export default FeaturedPaintsSection

const Section = styled.section`
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 4rem 0 4.5rem;
  color: var(--primary-color);
  --featured-card-width: clamp(9.5rem, 19vw, 13.5rem);

  @media (max-width: 760px) {
    width: calc(100% - 1.5rem);
    padding: 3rem 0 3.5rem;
    --featured-card-width: clamp(8.75rem, 42vw, 10.5rem);
  }

  @media print {
    display:none;
  }

  *{
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-drag: none;
  }
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
`

const StyledH1 = styled.h2`
  color : var(--primary-link-color);
  font-family: var(--title-font-family);
  display: flex;
  align-items: flex-start;
  text-decoration: none;
  padding: 0;
  height: 100%;
  font-size: 1rem;
  margin:0;
`

const CarouselControls = styled.div`
  display: flex;
  align-items: center;
  flex: 0 0 auto;
`

const CarouselButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  background: white;
  color: var(--primary-link-color);
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.35s ease;

  &:hover,
  &:focus{
    color: white;
    background: var(--primary-link-hover-color);
  }
`

const PaintList = styled.div`
  display: flex;
  flex-align: end;
  gap: 0.9rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 0.2rem;
  cursor: ${({ $isDragging }) => $isDragging ? 'grabbing' : 'grab'};
  scroll-behavior: smooth;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  touch-action: auto;
  -webkit-overflow-scrolling: touch;
  user-select: none;

  &::-webkit-scrollbar{
    display: none;
  }

  @media (max-width: 760px) {
    scroll-behavior: auto;
    scroll-snap-type: none;
  }
`
const PaintName = styled.span`
  display: block;
  margin-top: 0.45rem;
  overflow: hidden;
  font-family: var(--menu-font-family);
  font-size: 0.85rem;
  font-weight: 100;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const PaintLink = styled(Link)`
  display: block;
  flex: 0 0 var(--featured-card-width);
  color: var(--primary-color);
  text-decoration: none;
  scroll-snap-align: center;

  .gatsby-image-wrapper{
    transition: all 0.35s ease;

    animation: gallery-paint-appear ease-out;
    animation-timeline: view();
    animation-range: entry 0px cover max(100px, 20%);
  }

  ${PaintName}{
      transition: all 0.35s ease;
  }

  &:hover,
  &:focus{
    .gatsby-image-wrapper{
      transform: scale(1.02);
    }

  }
`

const PaintImage = styled.div`
  aspect-ratio: 1 / 1;
  width: 100%;
  overflow: hidden;
  background: rgba(241, 242, 239, 0.4);
  border: 1px solid rgba(51, 51, 51, 0.14);

  .gatsby-image-wrapper,
  img{
    width: 100%;
    height: 100%;
    object-fit: cover;

    
  }

  transition: color 0.35s ease;

  ${PaintLink}:hover,
  ${PaintLink}:focus{
    color: var(--primary-link-hover-color);
`

const MoreLink = styled(Link)`
  position: relative;
  display: block;
  flex: 0 0 var(--featured-card-width);
  color: var(--primary-link-color);
  font-family: var(--menu-font-family);
  font-size: 0.74rem;
  font-weight: 100;
  letter-spacing: 0;
  text-decoration: none;
  text-transform: uppercase;
  scroll-snap-align: center;
  transition: color 0.35s ease;

  &:hover,
  &:focus{
    color: var(--primary-link-hover-color);

    .gatsby-image-wrapper,
    img{
      transform: scale(1.08);
      opacity: 0.46;
    }

    .gallery-button{
      background: rgba(241, 242, 239, 0.82);
      border-color: rgba(51, 51, 51, 0.82);
    }

    .more-icon{
      margin-left: 1rem;
    }
  }
`

const SeeMoreCard = styled.div`
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  overflow: hidden;
  background: rgba(241, 242, 239, 0.42);
  border: 1px solid rgba(51, 51, 51, 0.14);

  .gatsby-image-wrapper,
  img{
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(2.5px);
    opacity: 0.58;
    transform: scale(1.05);
    transition: transform 0.35s ease, opacity 0.35s ease;
  }
`

const SeeMoreBlock = styled.span`
  display:flex;
  justify-content: end;
  margin-top: 0.45rem;
`

const MoreText = styled.span`
  display: block;
  overflow: hidden;
  font-family: var(--menu-font-family);
  font-size: 0.85rem;
  font-weight: 100;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MoreIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
  font-size: 1rem;

  transition: margin-left 0.35s ease;
`
const SeeMoreOverlay = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(241, 242, 239, 0.18);
`

const GalleryButton = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.45rem;
  padding: 0 1.15rem;
  border: 1px solid rgba(51, 51, 51, 0.46);
  background: rgba(241, 242, 239, 0.62);
  color: var(--primary-color);
  font-family: var(--menu-font-family);
  font-size: 0.78rem;
  font-weight: 100;
  line-height: 1;
  text-transform: uppercase;
  transition: border-color 0.35s ease, background-color 0.35s ease;
`
