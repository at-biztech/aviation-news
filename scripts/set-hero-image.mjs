#!/usr/bin/env node
/**
 * Finds the hero article (most impactful from last 7 days)
 * and sets its image_url by searching Unsplash based on title + summary.
 */
const fs = require('fs')

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY
if (!UNSPLASH_KEY) {
  console.log('No UNSPLASH_ACCESS_KEY, skipping hero image')
  process.exit(0)
}

const WEIGHT = { high: 3, medium: 2, low: 1 }
const articles = JSON.parse(fs.readFileSync('public/articles.json', 'utf8'))

// Find hero: most impactful from last 7 days, fallback to overall
const now = new Date()
const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

let candidates = articles
  .filter(a => new Date(a.publication_date + 'T00:00:00') >= weekAgo)
  .sort((a, b) => (WEIGHT[b.impact] || 0) - (WEIGHT[a.impact] || 0))

if (candidates.length === 0) {
  candidates = [...articles].sort((a, b) => (WEIGHT[b.impact] || 0) - (WEIGHT[a.impact] || 0))
}

const hero = candidates[0]
if (!hero) {
  console.log('No articles found')
  process.exit(0)
}

// Extract search terms from title (transliterate Russian to English keywords)
const aviaKeywords = [
  'aviation', 'business jet', 'private jet', 'aircraft', 'airplane',
  'airport', 'runway', 'charter', 'flight', 'airline'
]

// Build query: use category + generic aviation terms
const categoryMap = {
  'Деловая авиация': 'business jet private aviation luxury',
  'Геополитика и регулирование': 'aviation airport control tower regulation',
  'Технологии': 'aviation technology aircraft cockpit',
  'Чартерные перевозки': 'private jet charter flight luxury',
  'Цепочки поставок': 'aircraft maintenance hangar engine MRO',
  'Рынок и экономика': 'aviation market business jet fleet tarmac',
}

const query = categoryMap[hero.category] || 'business jet private aviation'

async function searchUnsplash() {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=10&order_by=relevant`

  const res = await fetch(url, {
    headers: { 'Authorization': `Client-ID ${UNSPLASH_KEY}` }
  })

  if (!res.ok) {
    console.log('Unsplash API error:', res.status)
    process.exit(0)
  }

  const data = await res.json()
  if (!data.results || data.results.length === 0) {
    console.log('No Unsplash results for:', query)
    process.exit(0)
  }

  // Pick a random photo from top 5 to avoid same image every day
  const top = data.results.slice(0, 5)
  const pick = top[Math.floor(Math.random() * top.length)]
  const imageUrl = pick.urls.raw + '&w=1600&q=90&fit=crop&crop=center'

  console.log('Hero:', hero.title.slice(0, 60))
  console.log('Query:', query)
  console.log('Image:', imageUrl.slice(0, 80) + '...')
  console.log('Photo by:', pick.user.name)

  // Set image on hero, clear all others
  articles.forEach(a => {
    if (a.slug === hero.slug) {
      a.image_url = imageUrl
    } else {
      a.image_url = null
    }
  })

  fs.writeFileSync('public/articles.json', JSON.stringify(articles, null, 2))
  console.log('Done. Hero image set.')
}

searchUnsplash().catch(e => {
  console.log('Error:', e.message)
  process.exit(0)
})
