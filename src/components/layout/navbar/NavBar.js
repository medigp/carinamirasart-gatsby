import React from "react"
import { Link } from "gatsby"
import styled from 'styled-components'
import NavLinks from "./NavLinks"
import MobileNavLinks from "./MobileNavLinks"
import { getTranslatedText } from "../../translate/TranslateText"
import CarinaSignature from "/src/components/themes/icons/logo"

const NavBar = ({pageTitle, showLogo = false, lang}) => {
    
    //const isMobile = useMediaQuery({ maxWidth : DeviceSize.mobile})
    const title = getTranslatedText('Page.title', lang)
    return (
        <Nav>
            <LeftSection>
                <NavLink to="/">
                    {showLogo &&
                        <LogoImg>
                            <CarinaSignature />
                        </LogoImg>
                    }
                    <LogoTxt>{title}</LogoTxt>
                </NavLink>
            </LeftSection>
            <MiddleSection></MiddleSection>
            <RightSection>
                {<NavLinks pageTitle={pageTitle}></NavLinks>}
                {<MobileNavLinks pageTitle={pageTitle}></MobileNavLinks>}
            </RightSection>
        </Nav>
    )
}

export default NavBar

const Nav = styled.nav`
    position:relative;
    display: flex;
    height: 80px;
    width: 100%;
    justify-content: space-between;
    align-items: center;
`

const LeftSection = styled.div`
    display:flex;
`
const MiddleSection = styled.div`
    display:none;
`
const RightSection = styled.div`
    display:flex;
    flex:2;
    justify-content: flex-end;
`
const LogoImg = styled.span`
    display:inline-block;
    margin-right: 5px;
    font-size:2em;
    line-height:1em;
`
const LogoTxt = styled.h2`
    font-size:2em;
    margin:0;
    font-weight: 500;
    font-family: var(--menu-font-family)
`

const NavLink = styled(Link)`
    color : var(--primary-link-color);
    display: flex;
    align-items: center;
    text-decoration: none;
    padding: 0;
    height: 100%;
    cursor: pointer;
    transition: all 0.2s ease-in 0.1s;

    :hover,
    :active,
    :focus{
        color : var(--primary-link-hover-color);
    }
`