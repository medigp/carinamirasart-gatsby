import React, { useState, useEffect } from "react"
import styled from 'styled-components'
import { Normalize } from "styled-normalize"
import { ThemeStyles } from "/src/components/themes/Theme"
import Header from '/src/components/layout/Header'
import Footer from '/src/components/layout/Footer'
import eventBus from "/src/components/communication/EventBus"
import CarinaSignature from "/src/components/themes/icons/CarinaSignature"

const loadedClassname = "app-loaded"

const getIsAlreadyLoaded = () => {
  if(typeof document === 'undefined')
    return false
  if(document && document.body && document.body.classList){
    return document.body.classList.contains(loadedClassname)
  }
  return false
}

const setIsAlreadyLoaded = () => {
  if(document && document.body && document.body.classList){
    if(!document.body.classList.contains(loadedClassname))
      document.body.classList.add(loadedClassname)
  }
}

const Layout = ({ pageTitle, children, showFooterIcon = true }) => {
  const [hideScroll, setHideScroll] = useState(false);
  const isAlreadyLoaded = getIsAlreadyLoaded()
  const [isPageLoaded, setIsPageLoaded] = useState(isAlreadyLoaded);
  const [showLoader, setShowLoader] = useState(!isAlreadyLoaded);

  eventBus.on("toggleShowMainScroll", (data) => {
    setHideScroll(!data);
  });

  eventBus.on("onInitialClientRender", (data) => {
    onLoadPage();
  });

  const onLoadPage = (e) => {
    setIsPageLoaded(true)
    setTimeout(function(){
      setShowLoader(false)
      setIsAlreadyLoaded()
    }, 500)
  }

  useEffect(() => {
    window.addEventListener('load', onLoadPage);
    return () => {
        window.removeEventListener('load', onLoadPage);
    };
})

  return (
    <>
    <Normalize />
    <ThemeStyles />
    <StyledLayout className={'body-wrapper' + (hideScroll || showLoader ? ' scroll-hidden' : '') + (showLoader ? ' show-loader' : '') + (isPageLoaded ? '' : ' page-loading')}>
      <StyledHeader pageTitle={pageTitle}/>
      <StyledBody>{children}</StyledBody>
      <StyledFooter showIcon={showFooterIcon} />
      <StyledLoader className='loading-block'>
          <StyledLoadingLogo>
            <CarinaSignature />
          </StyledLoadingLogo>
      </StyledLoader>
    </StyledLayout>
    </>
  )
}

export default Layout

const StyledLayout = styled.div`
  min-width: var(--media-minimum-width);
  background: var(--primary-bg-color);

  .ReactModalPortal{
    z-index:100;
  }

  &.scroll-hidden{
    overflow:hidden;
    height:100vh;
    width:100vw;
  }

  @media print {
    background: var(--print-bg-color);
  }
`
const StyledBody = styled.main`
  position: relative;
`
const StyledHeader = styled(Header)`
  min-width: var(--media-minimum-width);
`
const StyledFooter = styled(Footer)`
  min-width: var(--media-minimum-width);
`

const StyledLoader = styled.div`
`
const StyledLoadingLogo = styled.div`
`