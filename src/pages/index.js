import React from "react"
import Layout from '/src/components/layout/Layout'
import Seo from '/src/components/SEO'
import Hero from "/src/components/Hero"
import { getTranslatedText } from "/src/components/translate/TranslateText"

const Home = ({ transitionStatus }) => {
  const lang = null
  const title = getTranslatedText("Page.title", lang);
  return (
      <Layout pageTitle={title}>
        <Hero />
      </Layout>
  )
}
export default Home

export const Head = ({data, pageContext}) => {
  const lang = null
  const title = getTranslatedText("Page.title", lang);
  return (
    <Seo 
      pageId='landingPage'
      title={title}
      useTitleTemplate={false}
    />
  )
}