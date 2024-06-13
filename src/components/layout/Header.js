import React from "react"
import styled from 'styled-components'
import NavBar from "./navbar/NavBar"

const Header = ({pageTitle}) => {
    return (
        <StyledHeader>
            <LayoutContentWrapper>
                <NavBar pageTitle={pageTitle} />
            </LayoutContentWrapper>
        </StyledHeader>
    )
}

export default Header

const StyledHeader = styled.header`
    background: var(--header-bg-color);
    color: var(--header-color);
    z-index:100;
    position:fixed;
    height: var(--header-height);
    font-family: var(--menu-font-family);

    @media print {
        position: relative;
        background: var(--print-bg-color);
    }
`

const LayoutContentWrapper = styled.div`
  max-width: var(--max-content-width);
  margin:auto;
`