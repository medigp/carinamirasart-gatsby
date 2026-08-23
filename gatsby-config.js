/**
 * @type {import('gatsby').GatsbyConfig}
 */
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})


module.exports = {
  siteMetadata: {
    title: "Carina Miras.art",
    titleTemplate: "%s | Carina Miras.art",
    siteUrl: process.env.GATSBY_SITE_URL,
    defaultLanguage: "ca",
    description: "Carina Miras is a visual artist specialized in abstract works",
    url: process.env.GATSBY_SITE_URL,
    image: "/index-background.jpeg",
    icon: "src/images/icon.png",
    author: "Carina Miras",
    keywords: ["abstract art", "art"],
    social: {
      mail: "carina8618@gmail.com",
      twitter: "https://twitter.com/cari_miras",
      instagram: "https://www.instagram.com/carina.miras.art/",
      facebook: "https://www.facebook.com/carina.miras.art/",
      linkedin: "https://es.linkedin.com/in/carina-miras-boronat-395898112"
    }
  },

  plugins: [
    "gatsby-plugin-styled-components",

    /*
     * Google Analytics
     *
     * Només carreguem el plugin quan GOOGLE_ANALYTICS_ID
     * està definit.
     *
     * Això permet tenir Analytics a producció i deixar-lo
     * completament desactivat als entorns de test.
     */
    ...(process.env.GOOGLE_ANALYTICS_ID
      ? [
          {
            resolve: "gatsby-plugin-google-gtag",
            options: {
              // Es poden afegir múltiples IDs de tracking.
              trackingIds: [
                process.env.GOOGLE_ANALYTICS_ID,
              ],

              pluginConfig: {
                // Posa l'script de tracking al head.
                head: true,

                // Respecta Do Not Track.
                respectDNT: true,

                // Evita enviar pageviews des d'aquestes rutes.
                exclude: [
                  "/preview/**",
                  "/do-not-track/me/too/",
                ],
              },
            },
          },
        ]
      : []),

    "gatsby-plugin-image",

    {
      resolve: "gatsby-plugin-sitemap",
      options: {
        query: `
          {
            allSitePage {
              nodes {
                path
                pageContext
              }
            }
          }
        `,

        //, excludes : [ 'wall-labels' ]

        resolveSiteUrl: () => process.env.GATSBY_SITE_URL,

        resolvePages: ({
          allSitePage: {
            nodes: allPages
          }
        }) => {
          // console.log(allPages)
          return allPages
        },

        serialize: (props) => {

          const getUrlOnSiteMap = (path, url) => {
            if (url)
              return url

            return path
          }

          const getLastModDateString = (ondate) => {
            if (
              ondate === undefined ||
              !(ondate instanceof Date)
            )
              ondate = new Date()

            return ondate.toISOString().slice(0, 10)
          }

          if (!props || !props.pageContext)
            return null

          const {
            path,
            pageContext
          } = props

          const {
            lastModificationDate,
            type,
            url
          } = (pageContext || {})

          const changefreq =
            type === "Paint"
              ? "daily"
              : "monthly"

          const priority =
            url === undefined
              ? 1
              : 0.7

          const lastmod =
            getLastModDateString(lastModificationDate)

          return {
            url: getUrlOnSiteMap(path, url),
            changefreq,
            priority,
            lastmod
          }
        }
      }
    },

    {
      resolve: "gatsby-plugin-manifest",
      options: {
        icon: "src/images/icon.png"
      }
    },

    {
      resolve: "gatsby-plugin-mdx",
      options: {
        extensions: [".mdx"]
      }
    },

    {
      resolve: "gatsby-plugin-sharp",
      options: {
        defaults: {
          formats: ["auto", "webp"],
          placeholder: "blurred"
        }
      }
    },

    "gatsby-transformer-sharp",

    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "image",
        path: `${__dirname}/src/images/`,
        ignore: [
          '/\\.(?!((gif|jpe?g|tiff?|png|webp|bmp))))$/i'
        ]
      },
      __key: "images"
    },

    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "content",
        path: `${__dirname}/content/`,
        ignore: [
          '/\\.(?!((gif|jpe?g|tiff?|png|webp|bmp))))$/i'
        ]
      },
      __key: "content"
    },

    {
      resolve: "gatsby-transformer-remark",
      options: {
        plugins: [
          {
            resolve: "gatsby-remark-images",
          },
          "gatsby-remark-lazy-load",
        ]
      }
    },

    {
      resolve: "gatsby-plugin-google-fonts",
      options: {
        fonts: [
          "Source Sans Pro: 300, 400, 400i, 700",
          "Montserrat:300, 400, 400i, 700",
          "Josefin Sans:300,400, 400i, 700",
          "Open Sans:300,400, 400i, 700",
        ],
        display: "swap",
        crossOrigin: "anonymous"
      }
    }
  ]
}