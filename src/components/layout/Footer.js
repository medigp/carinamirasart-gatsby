import React from "react"
import styled from 'styled-components'
import SocialMedia from "./SocialMedia"
import TranslateText from "/src/components/translate/TranslateText"
import CarinaSignature from "/src/components/themes/icons/logo"

const Footer = ({showIcon = true}) => {
    
    const title = "Carina Miras.art"
    return (
        <StyledFooter
            className="general-footer">
            <LayoutContentWrapper>
              {showIcon && 
                <SignatureWrapper>
                  <SignatureLink
                    href="/"
                    title={title}>
                    <StyledIcon>
                      <CarinaSignature />
                    </StyledIcon>
                  </SignatureLink>
                </SignatureWrapper>
              }
                <SocialMediaBlock />
                
                <CopyRightUl>
                    <li><TranslateText text='footer.copyright' /></li>
                </CopyRightUl>
            </LayoutContentWrapper>
        </StyledFooter>
    )
}

export default Footer

const StyledFooter = styled.footer`
  position:relative;
  background: var(--footer-bg-color);
  color: var(--footer-color);
  min-height: var(--footer-height);
	align-self: flex-end;
	cursor: default;
	text-align: center;
    z-index:1;

    @media print {
        display:inline-block;
        page-break-inside: avoid;
        break-inside: avoid;
    }
`

const LayoutContentWrapper = styled.section`
  display: grid;
  grid-template-areas: 
    "signature"
    "social-media"
    "copyright";
  max-width: var(--max-content-width);
  margin:auto;
  padding: 1rem;

  @media print {
    border-top:1px solid var(--alternative-color);

    grid-template-areas: 
      "signature social-media"
      "copyright copyright";
  }
`

const SignatureWrapper = styled.div`
  grid-area: signature;
  text-align:center;

  * {
      color: var(--primary-link-color);
      transition: color 0.5s ease;
  }

  :hover *,
  :active *{
      color : var(--primary-link-hover-color);
  }
`

const SignatureLink = styled.a`
  text-decoration: none;
  font-size: 8rem;
  line-height: 1em;
`

const StyledIcon = styled.span`
    display:inline-block;
`
const SocialMediaBlock = styled(SocialMedia)`
  grid-area: social-media;
`
const CopyRightUl = styled.ul`
  grid-area: copyright;
  font-size:0.8em;
  padding-top:0;
`
