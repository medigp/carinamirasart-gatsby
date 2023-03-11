import React from "react"
import styled from 'styled-components'
import { useSiteMetadata } from '/src/components/hooks/useSiteMetadata'
import { TranslateText, getTranslatedText } from "../translate/TranslateText"
import { BsInstagram, BsTwitter } from 'react-icons/bs'
import { FaLinkedinIn, FaFacebookF } from 'react-icons/fa'
import { FiMail } from 'react-icons/fi'

const SocialMedia = ({ specialClassname, showSocialMediaText = false}) => {
    let classname = "socialmedia";
    if(specialClassname)
        classname +=" "+specialClassname;

    const { site } = useSiteMetadata()
    const { siteMetadata } = (site || {})
    const { social } = (siteMetadata || {})
    const { mail, instagram, linkedin, facebook, twitter } = (social || {})

    const instaLink = instagram !== undefined ? instagram : 'https://www.instagram.com/carina.miras.art/'
    const fbLink = facebook !== undefined ? facebook : 'https://www.facebook.com/carina.miras.art/'
    const liLink = linkedin !== undefined ? linkedin : 'https://es.linkedin.com/in/carina-miras-boronat-395898112'
    const twitterLink = twitter !== undefined ? twitter : 'https://twitter.com/cari_miras'
    const mailLink = mail !== undefined ? mail : 'hi@carinamiras.art'

    const instagramTitle = getTranslatedText('Contact.instagram.title')
    const twitterTitle = getTranslatedText('Contact.twitter.title')
    const facebookTitle = getTranslatedText('Contact.facebook.title')
    const linkedinTitle = getTranslatedText('Contact.linkedin.title')
    const mailTitle = getTranslatedText('Contact.mail.title')

    return (
            <SocialMediaList
                className={classname}>
                <SocialMediaItem>
                    <SMLink
                        href={instaLink}
                        title={instagramTitle}
                        target="_blank" 
                    >
                        <StyledIcon><BsInstagram /></StyledIcon>
                        {showSocialMediaText && <span className='socialmedia-text'><TranslateText text='footer.instagram' /></span>}
                        <PrintDescription>{instaLink}</PrintDescription>
                    </SMLink>
                </SocialMediaItem>
                <SocialMediaItem>
                    <SMLink
                        href={twitterLink}
                        title={twitterTitle}
                        target="_blank" 
                    >
                        <StyledIcon><BsTwitter /></StyledIcon>
                        {showSocialMediaText && <span className='socialmedia-text'><TranslateText text='footer.twitter' /></span>}
                        <PrintDescription>{twitterLink}</PrintDescription>
                    </SMLink>
                </SocialMediaItem>
                <SocialMediaItem>
                    <SMLink
                        href={fbLink}
                        title={facebookTitle}
                        target="_blank" 
                    >
                        <StyledIcon><FaFacebookF /></StyledIcon>
                        {showSocialMediaText && <span className='socialmedia-text'><TranslateText text='footer.facebook' /></span>}
                        <PrintDescription>{fbLink}</PrintDescription>
                    </SMLink>
                </SocialMediaItem>
                <SocialMediaItem>
                    <SMLink
                        href={liLink}
                        title={linkedinTitle}
                        target="_blank" 
                    >
                        <StyledIcon><FaLinkedinIn /></StyledIcon>
                        {showSocialMediaText && <span className='socialmedia-text'><TranslateText text='footer.linkedin' /></span>}
                        <PrintDescription>{liLink}</PrintDescription>
                    </SMLink>
                </SocialMediaItem>
                <SocialMediaItem>
                    <SMLink
                        href={'mailto:' + mailLink} 
                        title={mailTitle}
                        target="_blank" 
                    >
                        <StyledIcon><FiMail /></StyledIcon>
                        {showSocialMediaText && <span className='socialmedia-text'><TranslateText text='footer.mail' /></span>}
                        <PrintDescription>{mailLink}</PrintDescription>
                    </SMLink>
                </SocialMediaItem>
            </SocialMediaList>
    )
}

export default SocialMedia

const SocialMediaList = styled.ul`
    position:relative;
    display:flex;
    flex-direction: row;
	justify-content: center;
    align-content: center;
    align-items: center;
	text-align: center;
    gap: 1.5rem;
    list-style: none;
    z-index:1;

    .hide-names span.socialmedia-text{
        display:none;
    }

    @media print {
        flex-direction: column;
        align-items: flex-start;
    }
`

const SocialMediaItem = styled.li`
    text-decoration: none;
`

const SMLink = styled.a`
    text-decoration: none;

    * {
        color: var(--primary-link-color);
        transition: color 0.5s ease;
    }

    .socialmedia-text{
        transition: color 0.2s ease;
    }

    :hover,
    :active,
    :focus{
        * {
        color : var(--primary-link-hover-color);
    }
    }
`

const StyledIcon = styled.span`
    display:inline-block;
    font-size:1em;
    margin-right:2px;
`

const PrintDescription = styled.span`
    display:none;
    font-size:1em;
    margin-left:10px;

    @media print {
        display:inline-block;
    }
`


