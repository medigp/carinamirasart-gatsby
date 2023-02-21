import React from "react"
import styled from 'styled-components'
import { HamburgerSlider } from 'react-animated-burgers'


const MenuToggle = ({toggle, isOpen}) => {
    return (
        <BurguerIcon toggleButton={toggle} isActive={isOpen}/>
    )
}

export default MenuToggle

const BurguerIcon = styled(HamburgerSlider)`
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