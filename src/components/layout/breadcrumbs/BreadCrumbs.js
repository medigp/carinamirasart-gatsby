import React from "react"
import { Link } from "gatsby"
import styled from 'styled-components'
import TranslateText from "../../translate/TranslateText"
import { RiArrowRightSLine } from 'react-icons/ri'
import { HiHome } from 'react-icons/hi'

const BreadCrumbs = ({pagesArray = [], showHomeIcon = false, pageTitle = "" , titleAsH1 = true, dropdown = []}) => {
    if(!pagesArray || pagesArray.length === 0)
        return (<></>);
    let pages = []
    pagesArray.forEach((page, i , row) => {
        if(page === null)
            return;
        const { text, url } = page
        const isLast = (i === row.length - 1)
        const showSeparator = !isLast
        const title = (pageTitle !== "" && isLast)? pageTitle : text
        const classname = (isLast ? 'page-title' : '') + (pagesArray.length === 1 ? '' : ' selected')
        const isH1 = titleAsH1 && isLast
        const avoidTranslateTitle = title !== 'Gallery'
        pages.push({
            url,
            title,
            classname,
            showSeparator,
            isH1,
            avoidTranslateTitle
        })
    })
    
    return (
        <Nav>
            <NavWrapper>
                {showHomeIcon && 
                    <BCWrapper>
                        <ElementWrapper>
                            <NavLink to="/">
                                <HomeIcon />
                            </NavLink>
                        </ElementWrapper>
                    </BCWrapper>
                }
                {pages.map((page, index) => (
                    <BCWrapper key={index}>
                        <ElementWrapper
                            className={page.classname}>
                            {page.isH1 && 
                                <StyledH1><TranslateText text={page.title} avoidTranslate={page.avoidTranslateTitle}/></StyledH1>}
                            {!page.isH1 && 
                                <NavLink to={page.url}><TranslateText text={page.title} avoidTranslate={page.avoidTranslateTitle} /></NavLink>}
                        </ElementWrapper>
                        {page.showSeparator &&
                            <ElementWrapper>
                                <Separator />
                            </ElementWrapper>
                        }
                    </BCWrapper>
                ))}
                {dropdown && dropdown.length > 0 && 
                    <div>TODO: JSON.stringify(dropdown)</div>
                }
            </NavWrapper>
        </Nav>
    )
}

export default BreadCrumbs

const Nav = styled.nav`
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    text-align:left;
    font-family: var(--menu-font-family);
`

const NavWrapper = styled.div`
    display: block;    
    z-index: 1;
    text-align: left;
`
const BCWrapper = styled.div`
    display: inline-block;
`
const ElementWrapper = styled.span`
    display: inline-block;
    line-height:1rem;
    text-decoration: none;
    padding: 1em 1em 1em 0;
    vertical-align: top;
    font-size: 1rem;

    &.page-title{
        font-weight: bold;
        
        &.selected h1{
            color: var(--alternative-color)
        }
    }
`

const HomeIcon = styled(HiHome)`
    font-size: 1rem;
`
const Separator = styled(RiArrowRightSLine)`
    color : var(--primary-color);
`

const StyledH1 = styled.h1`
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

const NavLink = styled(Link)`
    color : var(--primary-link-color);
    display: flex;
    align-items: flex-start;
    text-decoration: none;
    padding: 0;
    height: 100%;
    cursor: pointer;
    transition: all 0.2s ease-in 0.1s;

    &.page-title{
        font-weight: bold;
    }

    :hover,
    :active,
    :focus{
        color : var(--primary-link-hover-color)
    }
`
