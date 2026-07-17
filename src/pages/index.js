import React from 'react'
import Layout from '/src/components/layout/Layout'
import Seo from '/src/components/SEO'
import Hero from '/src/components/Hero'
import FeaturedPaintsSection from '/src/components/FeaturedPaintsSection'
import { getTranslatedText } from '/src/components/translate/TranslateText'
import { graphql } from 'gatsby'

const getDayOfYear = (date) => {
  const start = new Date(date.getFullYear(), 0, 0)
  const timezoneOffset = (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000
  const diff = date - start + timezoneOffset
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const getSeededRandom = (seed) => {
  let value = seed % 2147483647
  if (value <= 0) {
    value += 2147483646
  }

  return () => {
    value = value * 16807 % 2147483647
    return (value - 1) / 2147483646
  }
}

const getRotatingPaints = (paints, durationDays = 5, count = 9, date = new Date()) => {
  if (!paints || paints.length === 0) {
    return []
  }

  const safeDurationDays = Math.max(1, durationDays)
  const safeCount = Math.max(1, count)
  const dayOfYear = getDayOfYear(date)
  const period = Math.floor((dayOfYear - 1) / safeDurationDays)
  const seed = date.getFullYear() * 1000 + period
  const random = getSeededRandom(seed)
  const shuffledPaints = [...paints]

  for (let i = shuffledPaints.length - 1; i > 0; i--) {
    const swapIndex = Math.floor(random() * (i + 1))
    const current = shuffledPaints[i]
    shuffledPaints[i] = shuffledPaints[swapIndex]
    shuffledPaints[swapIndex] = current
  }

  return shuffledPaints.slice(0, Math.min(safeCount, shuffledPaints.length))
}

const Home = ({data}) => {
  const lang = null
  const title = getTranslatedText('Page.title', lang);
  const { allPaint = {} } = data || {}
  const { nodes: latestPaints = [] } = allPaint
  const rotatingPaints = getRotatingPaints(latestPaints, 5, 10)
  const featuredPaints = rotatingPaints.slice(0, 9)
  const galleryBackgroundPaint = rotatingPaints[9]

  return (
      <Layout pageTitle={title}>
        <Hero />
        <FeaturedPaintsSection
          title='Page.paintssection.title'
          paints={featuredPaints}
          galleryBackgroundPaint={galleryBackgroundPaint}
        />
      </Layout>
  )
}
export default Home

export const Head = ({data, pageContext}) => {
  const lang = null
  const title = getTranslatedText('Page.title', lang);
  return (
    <Seo 
      pageId='landingPage'
      title={title}
      useTitleTemplate={false}
    />
  )
}

export const query = graphql`
query {
  allPaint(
    limit: 20
    filter: {hide: {eq: false}, showOnMainScreen: {eq: true}}
    sort: [{date: DESC}, {title: DESC}]
  ) {
    nodes {
      id
      reference
      url
      title
      image {
        main {
          name
          imageReference: childImageSharp {
            gatsbyImageData(width: 360, quality: 90, webpOptions: {quality: 80})
          }
        }
        image_alt_text
      }
    }
  }
}
`
