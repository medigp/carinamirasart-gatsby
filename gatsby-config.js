/**
 * @type {import('gatsby').GatsbyConfig}
 */
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
  siteMetadata: {
    title: "Carina Miras.art",
    titleTemplate : "%s | Carina Miras.art",
    siteUrl: process.env.GATSBY_SITE_URL,
    defaultLanguage : "ca",
    description : "Carina Miras is a visual artist specialized in abstract works",
    url: process.env.GATSBY_SITE_URL,
    image : "/index-background.jpeg",
    icon : "src/images/icon.png",
    author: "Carina Miras",
    keywords : ["abstract art", "art"],
    social : {
      mail : "hi@carinamiras.art",
      twitter : "@carinamiras.art",
      instagram : 'https://www.instagram.com/carina.miras.art/',
      facebook : 'https://www.facebook.com/carina.miras.art/',
      linkedin : 'https://es.linkedin.com/in/carina-miras-boronat-395898112'
    }
  },
  plugins: [
    "gatsby-plugin-styled-components"
    , { 
      resolve : "gatsby-plugin-google-gtag",
      options : {
        // You can add multiple tracking ids and a pageview event will be fired for all of them.
        trackingIds: [
          process.env.GOOGLE_ANALYTICS_ID, // Google Analytics / GA
        ],
        // This object is used for configuration specific to this plugin
        pluginConfig: {
          // Puts tracking script in the head instead of the body
          head: true,
          // Setting this parameter is also optional
          respectDNT: true,
          // Avoids sending pageview hits from custom paths
          exclude: ["/preview/**", "/do-not-track/me/too/"],
        },
      }
    }
    , "gatsby-plugin-image"
    , "gatsby-plugin-sitemap", {
      resolve: 'gatsby-plugin-manifest',
      options: {
        "icon": "src/images/icon.png"
      }
    }
    , {
      resolve : "gatsby-plugin-mdx",
      options : {
        extensions : [ '.mdx' ]
      }
    }
    , {
      resolve : 'gatsby-plugin-sharp',
      options : {
        defaults: {
          formats: [`auto`, `webp`],
          placeholder: `blurred`
        }
      }
    }
    , "gatsby-transformer-sharp"
    , {
      resolve: 'gatsby-source-filesystem',
      options : {
        name : 'image',
        path : `${__dirname}/src/images/`,
        ignore : ['/\.(?!((gif|jpe?g|tiff?|png|webp|bmp))))$/i']
      },
      __key: "images"
    }
    , {
      resolve : 'gatsby-source-filesystem',
      options : {
        name : 'content',
        path : `${__dirname}/content/`,
        ignore : ['/\.(?!((gif|jpe?g|tiff?|png|webp|bmp))))$/i']
      },
      __key: "content"
    }
    , {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
          },
          `gatsby-remark-lazy-load`,
        ]
      }
    }
    , { 
      resolve: 'gatsby-plugin-google-fonts',
      options : {
        fonts: [
          'Source Sans Pro: 300, 400, 400i, 700',
          'Montserrat:300, 400, 400i, 700',
          'Josefin Sans:300,400, 400i, 700',
          'Open Sans:300,400, 400i, 700',
        ],
        display : 'swap'
      }
    },
  ]
};