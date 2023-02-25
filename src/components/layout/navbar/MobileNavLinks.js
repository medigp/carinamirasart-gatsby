import React, { useState } from "react"
import { Link } from "gatsby"
import styled from 'styled-components'
import Hamburger from 'hamburger-react'
import { DeviceSize } from "/src/data/responsive"
import {TranslateText, getTranslatedText} from "/src/components/translate/TranslateText"
import eventBus from "/src/components/communication/EventBus"

import { menuData } from '/src/data/MenuData'
import SocialMedia from "/src/components/layout/SocialMedia"

const MobileNavLinks = (props) => {
    const {pageTitle, lang} = props;
    const [isOpen, setOpen ] = useState(false);

    const classname = isOpen? 'opened-wrapper' : 'closed-wrapper';

    const toggleIsOpen = () => {
        const newValue = !isOpen
        setOpen(newValue)
        eventBus.dispatch("toggleShowMainScroll", !newValue)
    }

    return (
        <>
        <NavLinksContainer>
            <MenuToggle toggled={isOpen} toggle={toggleIsOpen} />
            <LinksWrapper
                className={classname}>
                {menuData.map((option, index) => (
                    <LinkItem key={index}>
                        <LinkItemWrapper>
                            <NavLink to={option.link} key={option.title+'-'+index}
                                className={getTranslatedText(option.title, lang) === pageTitle ? 'selected' : ''}>
                                <TranslateText text={option.title} lang={lang} />
                            </NavLink>
                        </LinkItemWrapper>
                    </LinkItem>
                ))}
                    <SMLinkItem>
                        <SocialMediaWrapper>
                            <SocialMedia />
                        </SocialMediaWrapper>
                    </SMLinkItem>
            </LinksWrapper>
        </NavLinksContainer>
        </>
    )
}

export default MobileNavLinks

const NavLinksContainer = styled.div`
    height: 100%;
    align-items:center;
    display: flex;

    @media ( min-width : ${DeviceSize.mobile}px ){
        display: none;
    }
`

const LinksWrapper = styled.ul`
    background: var(--mobile-bg-menu-color);
    color: var(--primary-link-color);
    margin:0;
    padding:0;
    display:flex;
    height: 100%;
    list-style:none;
    width:100%;
    flex-direction: column;
    justify-content: center;
    gap: 2rem;
    position:fixed;
    top:80px;
    left:0;

    transition: opacity 0.2s ease-in, 
                visibility 0.2s ease-in, 
                transform 0.5s ease-in 0.1s, 
                display 0.5s linear 2s;

    li{
        div{
            position: relative;

            ::after,
            ::before{
                position:absolute;
                display:block;
                content:'';
                width:100px;
                height:3px;
                bottom:0px;
                left: calc(50% - 50px);
                background:var(--primary-link-color);
                z-index:2;
            }

            ::before{
                background:var(--primary-link-hover-color);
                z-index:3;
                
                left:calc(50% - 50px);
                margin-left:0px;
                width:10px;
                transition: all 0.2s ease-in 0.1s;
            }

            &:hover::before{
                width:100px;
                left: calc(50% - 50px);
                margin-left:0;
            }
            
            a{
                display:inline-block;
                width:auto;
                transition: all 0.2s ease-in 0.1s;

                &.selected{
                    color: var(--primary-link-hover-color);
                }
            }
        }
    }

    &.closed-wrapper{
        opacity: 0;
        visibility: hidden;
        
        li {
            a{
                border-bottom: 2px solid black;
                opacity:0;
                transform : translateY(100px);
            }
        }
    }
`
const LinkItem = styled.li`
    justify-content: center;
    display:flex;
    padding: 2rem 0;
`

const SMLinkItem = styled(LinkItem)`
    padding-top: 3rem;
`
const LinkItemWrapper = styled.div`
    display: inline-block;
    overflow:hidden;
    padding: 5px;
`
const SocialMediaWrapper = styled.div`
    border-top: 1px solid var(--primary-link-hover-color);
    
    ::after,
    ::before{
        display:none !important;
    }
`

const NavLink = styled(Link)`
    color : var(--primary-link-color);
    display: flex;
    width: 100%;
    justify-content: center;
    text-align:center;
    text-decoration: none;
    padding: 0;
    cursor: pointer;
    font-size: clamp(1.5rem, 6vw, 4rem);

    :hover,
    :active,
    :focus{
        color : var(--primary-link-hover-color);
    }
`

const MenuToggle = styled(Hamburger)`
    color : var(--primary-link-color);
    padding: 0 0 0 1rem;
    height: 100%;
    cursor: pointer;
    font-size: 0.8rem;
    transform: scale(0.7);
    transition: all 0.2s ease-in;

    :hover,
    :active,
    :focus{
        color : var(--primary-link-hover-color);
        transform: scale(1);
    }
`

