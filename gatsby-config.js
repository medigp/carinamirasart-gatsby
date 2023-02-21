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
    icon : "/favicon/favicon.ico",
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
    'gatsby-plugin-styled-components',
    { 
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
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-image',
    {
      resolve : 'gatsby-plugin-sharp',
      options : {
        defaults: {
          formats: [`auto`, `webp`],
          placeholder: `blurred`
        }
      }
    },
    {
      resolve : 'gatsby-plugin-mdx',
      options : {
        extensions: [`.mdx`, `.md`],
      }
    },
    {
      resolve : 'gatsby-source-filesystem',
      options : {
        name : 'image',
        path : `${__dirname}/src/images/`,
        ignore : ['/\.(?!((gif|jpe?g|tiff?|png|webp|bmp))))$/i']
      }
    },
    {
      resolve : 'gatsby-source-filesystem',
      options : {
        name : 'content',
        path : `${__dirname}/content/`,
        ignore : ['/\.(?!((gif|jpe?g|tiff?|png|webp|bmp))))$/i']
      }
    },
    'gatsby-transformer-remark',
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
          },
          `gatsby-remark-lazy-load`,
        ]
      }
    },
    'gatsby-transformer-json',
    'gatsby-transformer-yaml',
    'gatsby-transformer-sharp'
  ],
};
