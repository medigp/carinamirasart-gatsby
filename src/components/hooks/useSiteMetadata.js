import { useStaticQuery, graphql } from "gatsby"

export const useSiteMetadata = () => {
  const data = useStaticQuery(
    graphql`
      query SiteMetaData {
        site {
          siteMetadata {
            title
            titleTemplate
            description
            author
            keywords
            social {
                mail,
                twitter,
                instagram,
                linkedin,
                facebook
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
  )
  return data
}