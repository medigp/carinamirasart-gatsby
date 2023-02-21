/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */
 import React from 'react'
 import PropTypes from 'prop-types'
 import Helmet from 'react-helmet'
 import { StaticQuery, graphql } from 'gatsby'
 import { getTranslatedText, getExistsTranslation } from './translate/TranslateText'
 import favicon from '../../src/images/favicon/favicon.ico';

 const getSiteURL = (data) => {
    if(process.env.GATSBY_SITE_URL)
        return process.env.GATSBY_SITE_URL
    if(data && data.site && data.site.siteMetadata){
      if(data.site.siteMetadata.siteUrl)
        return data.site.siteMetadata.siteUrl
      if(data.site.siteMetadata.url)
        return data.site.siteMetadata.url
    }
    let url = "https://www.carinamiras.art"
    if(typeof window === `undefined`)
      return url
    return window.location.origin
 }

 function Seo({ pageId, description, lang, image, meta, keywords, title, useTitleTemplate = true, pathname, url : pageUrl }) {
   return (
     <StaticQuery
       query={detailsQuery}
       render={data => {
         const urlSite = getSiteURL(data)
         const pageIdDescription = getExistsTranslation(pageId + '.seo.description', lang) ? getTranslatedText(pageId + '.seo.description', lang) : null
         const metaDescription = description || pageIdDescription || data.site.siteMetadata.description
         const author = data.site.siteMetadata.author
         const imageRef = image || data.featuredImage
         const ogImage = imageRef && imageRef.childImageSharp && imageRef.childImageSharp.gatsbyImageData ? imageRef.childImageSharp.gatsbyImageData.images : null
         const metaImage = ogImage ? `${urlSite}${ogImage.fallback.src}` : null
         const metaUrl = `${urlSite}${pathname}`
         const titleTemplate = (!useTitleTemplate ? data.site.siteMetadata.title : data.site.siteMetadata.titleTemplate )
         //const favicon = data.site.siteMetadata.favicon
         if(!pageUrl && pageId && pageId !== 'landingPage')
          pageUrl = '/'+pageId.toLowerCase()
         const metaUrlPage = metaUrl + (pageUrl ? pageUrl : '')
         const titleFilled = titleTemplate.replace('%s', title)

         const keywordsString = keywords ? keywords.join(`, `) : ''
         return (
           <Helmet
             htmlAttributes={{
               lang,
             }}
             title={title}
             titleTemplate={titleTemplate}
             link={[
                {
                  "rel": "shortcut icon", 
                  "type": "image/png", 
                  "href": `${favicon}`
                }
             ]}
           >
              
              <meta name="copyright" content={author} />
              <meta name="keywords" content={keywordsString} />

              <meta itemprop="name" content={titleFilled}/>
              <meta itemprop="description" content={metaDescription}/>
              <meta itemprop="image" content={metaImage}/>

              
              <meta property="og:url" content={metaUrlPage} />
              <meta property="og:type" content="website" />
              <meta property="og:title" content={titleFilled} />
              <meta property="og:description" content={metaDescription} />
              <meta property="og:image" content={metaImage} />
              <meta property="og:image:alt" content={titleFilled} />
              
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content={titleFilled} />
              <meta name="twitter:description" content={metaDescription} />
              <meta name="twitter:image" content={metaImage} />


           </Helmet>
         )
       }}
     />
   )
 }
 
 Seo.defaultProps = {
   lang: `ca`,
   meta: [],
   keywords: ['art','abstract art'],
   pathname: ``,
   description : ``
 }
 
 Seo.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    lang: PropTypes.string,
    image: PropTypes.object,
    meta: PropTypes.arrayOf(PropTypes.object),
    keywords: PropTypes.arrayOf(PropTypes.string),
    pathname: PropTypes.string,
   
 }
 
 export default Seo
 
 const detailsQuery = graphql`
   query DefaultSEOQuery {
     site {
       siteMetadata {
         title
         titleTemplate
         description
         author
         keywords
         social {
           mail
         }
       }
     }
     featuredImage : file(relativePath: {eq: "index-background.jpeg"}){
      childImageSharp {
        gatsbyImageData(width: 1200, layout : FIXED)
      }
    }
   }
 `