import React from "react"
import { Link } from "gatsby"
import styled from 'styled-components'
import { menuData } from '/src/data/MenuData'
import { DeviceSize } from "/src/data/responsive"
import {TranslateText, getTranslatedText} from "../../translate/TranslateText"

const NavLinks = ({pageTitle, lang}) => {

    return (
        <>
        <NavLinksContainer>
            <LinksWrapper>
                {menuData.map((option, index) => (
                    <LinkItem key={index}>
                        <LinkItemWrapper>
                            <NavLink to={option.link} key={index}
                                className={'nav-link-item' + (getTranslatedText(option.title, lang) === pageTitle ? ' selected' : '')}>
                                <TranslateText text={option.title} lang={lang}/>
                            </NavLink>
                        </LinkItemWrapper>
                    </LinkItem>
                ))}
            </LinksWrapper>
        </NavLinksContainer>
        </>
    )
}

export default NavLinks

const NavLinksContainer = styled.div`
    height: 100%;
    display: none;
    align-items:center;

    @media ( min-width : ${DeviceSize.mobile}px ){
        display: flex;
    }
`

const LinksWrapper = styled.ul`
    margin:0;
    padding:0;
    display:flex;
    height: 100%;
    color: var(--primary-link-color);
`
const LinkItem = styled.li`
    align-items: center;
    justify-content: center;
    height: 100%;    
    padding:0 1.1em;
    display:flex;

    @media print {
        .nav-link-item{
            display:none;
        }

        .nav-link-item.selected{
            display:inline-block;
        }
    }
`
const LinkItemWrapper = styled.div`
    display: inline-block;
    overflow:hidden;
    padding: 5px;
    position: relative;
    
    ::before{
        position:absolute;
        display:block;
        content:'';
        width:calc(100% - 2rem);
        height:3px;
        bottom:0px;
        left: 1rem;
        background:var(--primary-link-color);
        z-index:2;
    }

    ::before{
        background:var(--primary-link-hover-color);
        z-index:3;
        width:0px;
        transition: all 0.2s ease-in 0.1s;
    }

    &:hover::before{
        width:calc(100% - 2rem);
    }
    
    a{
        display:inline-block;
        width:auto;
        transition: all 0.2s ease-in 0.1s;
    }
`
const NavLink = styled(Link)`
    color : var(--primary-link-color);
    display: flex;
    align-items: center;
    text-decoration: none;
    padding: 0 1rem;
    height: 100%;
    cursor: pointer;

    :hover,
    :active,
    :focus{
        color : var(--primary-link-hover-color);
    }
`

