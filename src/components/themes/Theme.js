import { createGlobalStyle } from 'styled-components'
import { DeviceSize } from "/src/data/responsive"

const defaultMenuFontFamily =  '"Montserrat", sans-serif'
const defaultTitleFontFamily = '"Josefin Sans", sans-serif'
const defaultTextFontFamily = '"Open Sans", sans-serif'
const defaultLineHeight = '1.5'

const defaultPrimaryColor = '#333'
const defaultSecondaryColor = '#ff7496'
const defaultAlternativeColor = '#2ac1b2'

const defaultPrimaryBGColor = 'white'
const defaultSecondaryBGColor = '#b9feff'
const defaultAlternativeBGColor = ''

const maxContentWidth = '1024px';
const headerHeight = '80px'
const headerBgColor = 'rgba(255,255,255, 0.8)'
const footerHeight = '60px'
const layoutPadding = 2 // rem
const layoutMobilePadding = 1.5 //rem

export const ThemeStyles = createGlobalStyle`

    :root {
        --menu-font-family : ${defaultMenuFontFamily};
        --title-font-family : ${defaultTitleFontFamily};
        --text-font-family : ${defaultTextFontFamily};
        --text-line-height : ${defaultLineHeight};

        --primary-color : ${defaultPrimaryColor};
        --secondary-color : ${defaultSecondaryColor};
        --alternative-color : ${defaultAlternativeColor};

        --primary-bg-color : ${defaultPrimaryBGColor};
        --secondary-bg-color : ${defaultSecondaryBGColor};
        --alternative-bg-color : ${defaultAlternativeBGColor};

        --primary-link-color : var(--primary-color);
        --primary-link-hover-color : var(--secondary-color);

        --media-layout-mobile-padding : ${layoutMobilePadding}rem;
        --media-standard-mobile-width : calc(100% - ${layoutMobilePadding * 2}rem); 
        --media-minimum-mobile-width : calc(${DeviceSize.minimum}px - ${layoutMobilePadding * 2}rem);

        --media-layout-padding : ${layoutPadding}rem;
        --media-standard-width : calc(100% - ${layoutPadding * 2}rem); 
        --media-minimum-width : calc(${DeviceSize.minimum}px - ${layoutPadding * 2}rem);
        
        --media-mobile-width : ${DeviceSize.mobile}px;
        --media-tablet-width : ${DeviceSize.tablet}px;
        --media-laptop-width : ${DeviceSize.laptop}px;
        --media-desktop-width : ${DeviceSize.desktop}px;

        --max-content-width : ${maxContentWidth};

        --header-height : ${headerHeight};
        --header-color : var(--primary-color);
        --header-bg-color : ${headerBgColor};
        
        --footer-height : ${footerHeight};
        --footer-color : var(--primary-color);
        --footer-bg-color : var(--primary-bg-color);

        --mobile-bg-menu-color : var(--secondary-bg-color);
    }

    body {
        background: var(--primary-bg-color);
        color: var(--primary-color);
        font-family: var(--text-font-family);
        line-height: var(--text-line-height); 
        min-width: var(--media-minimum-width);
    }

    .body-wrapper{
        header,
        main,
        footer{
            opacity:1;
            transition: opacity 1s ease;
            min-width: var(--media-minimum-width);            
        }

        .loading-block{
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background:transparent;
            position:fixed;
            top:0;left:0;
            width:100vw;height:100vh;
            z-index:100;

            div{
                opacity: 0;
                transition: all 0.5s ease;

                svg{
                    xx-font-size: clamp(10rem, 30vw, 15rem);
                    font-size: 80rem;
                    color:#333;
                    transition: all 0.5s ease;
                }
            }
        }

        &.show-loader{
            .loading-block{
                display: flex;
            }

            &.page-loading{
                header,
                main,
                footer{
                    opacity:0;
                }

                .loading-block{
                    div{
                        opacity:1;

                        svg{
                            font-size: clamp(10rem, 30vw, 15rem);
                            x-font-size: clamp(8rem, 25vw, 15rem);
                        }
                    }
                }

            }
        }
    }

    header,
    main,
    footer{
        width: var(--media-standard-mobile-width);
        padding-left: var(--media-layout-mobile-padding);
        padding-right: var(--media-layout-mobile-padding);
    
        @media ( min-width : ${DeviceSize.mobile}px){
            width: var(--media-standard-width);
            padding-left: var(--media-layout-padding);
            padding-right: var(--media-layout-padding);    
        }
    }

    main {
        padding-top: var(--header-height);
        padding-bottom: 1rem;
        min-height: calc(100vh - (2rem + var(--header-height) + var(--footer-height)));

        @media print {
            padding-top: 0;   
            min-height: auto;
        }
    }

    h1, h2, h3{
        font-family: var(--title-font-family);
    }

    a{
        color: var(--primary-link-color);
        transition: color 0.5s ease;
    }

    a:hover,
    a:active,
    a:focus{
        color: var(--primary-link-hover-color);
    }

    ol, ul {
		list-style: none;
        padding:0;
	}
    
    header nav ul li a {
        display:inline-block;
        padding:1rem;
        text-decoration: none;
        color: var(--primary-color);
    }

    header nav a.selected{
        font-weight: bold;
        color: var(--alternative-color);
    }
`