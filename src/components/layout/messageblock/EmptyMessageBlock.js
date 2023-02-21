import React from "react"
import { graphql, useStaticQuery } from "gatsby"
import MessageBlock from "/src/components/layout/messageblock/MessageBlock"
import { getTranslatedText } from "/src/components/translate/TranslateText";

const EmptyMessageBlock = ({title, subtitle, text, addDefaultText = true, showLinkToHome = false}) => {
    
    const { imageReference } = useStaticQuery(
        graphql`
          query {
            imageReference : file(relativePath: {eq: "404.jpg"}){
              id
              childImageSharp {
                gatsbyImageData(width: 500, quality: 90, webpOptions: {quality: 80})
              }
            }
          }
        `
      )
    
    

    if(addDefaultText){
      title = title || getTranslatedText('Messageblock.title.empty')
      subtitle = subtitle || getTranslatedText('Messageblock.subtitle')
    }

    return (
        <MessageBlock
            image={imageReference}
            title={title}
            subtitle={subtitle}
            text={text}
        />
    )
}

export default EmptyMessageBlock