#!/usr/bin/env node
/**
 * Sets hero image by searching Unsplash based on article title and summary.
 * Extracts English keywords from Russian text for better image matching.
 */
import { readFileSync, writeFileSync } from 'fs'

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY
if (!UNSPLASH_KEY) {
  console.log('No UNSPLASH_ACCESS_KEY, skipping')
  process.exit(0)
}

const WEIGHT = { high: 3, medium: 2, low: 1 }
const articles = JSON.parse(readFileSync('public/articles.json', 'utf8'))

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

// Extract search query from article content
// Map common Russian aviation terms to English for Unsplash search
const termMap = {
  'авиатоплив': 'jet fuel aviation',
  'топлив': 'fuel oil price',
  'иран': 'middle east conflict military',
  'конфликт': 'geopolitics world map',
  'чартер': 'private jet charter luxury',
  'поставк': 'aircraft parts warehouse logistics',
  'двигател': 'aircraft engine turbine maintenance',
  'аэропорт': 'airport terminal runway',
  'казахстан': 'central asia airport steppe',
  'регулир': 'government regulation document',
  'налог': 'tax finance government building',
  'безопасн': 'aviation safety pilot cockpit',
  'поставок': 'supply chain warehouse parts',
  'рынок': 'business market stock finance',
  'экономик': 'economy market business',
  'флот': 'aircraft fleet tarmac lineup',
  'маршрут': 'flight route world map globe',
  'пассажир': 'airline passengers terminal',
  'Bombardier': 'Bombardier business jet',
  'Gulfstream': 'Gulfstream private jet',
  'Embraer': 'Embraer business jet',
  'Dassault': 'Dassault Falcon jet',
  'Boeing': 'Boeing aircraft',
  'MRO': 'aircraft maintenance hangar',
  'ТОиР': 'aircraft maintenance hangar',
  'EASA': 'aviation regulation europe',
  'FAA': 'aviation regulation america',
  'ICAO': 'international aviation organization',
  'бизнесджет': 'business jet private aviation',
  'бизнесавиац': 'business aviation private jet',
  'Air Astana': 'Air Astana Kazakhstan airline',
  'SCAT': 'Kazakhstan airline aircraft',
}

// Build query from title + summary
const text = (hero.title + ' ' + hero.summary).toLowerCase()
let queryParts = []

for (const [ru, en] of Object.entries(termMap)) {
  if (text.includes(ru.toLowerCase())) {
    queryParts.push(en)
  }
}

// Always add aviation context
if (queryParts.length === 0) {
  queryParts.push('business aviation private jet')
}

// Limit to first 3 matches to keep search focused
const query = queryParts.slice(0, 3).join(' ')

async function searchUnsplash() {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=10&order_by=relevant`

  console.log('Hero:', hero.title.slice(0, 60))
  console.log('Query:', query)

  const res = await fetch(url, {
    headers: { 'Authorization': `Client-ID ${UNSPLASH_KEY}` }
  })

  if (!res.ok) {
    console.log('Unsplash API error:', res.status)
    process.exit(0)
  }

  const data = await res.json()
  if (!data.results || data.results.length === 0) {
    console.log('No results, using fallback')
    process.exit(0)
  }

  // Pick random from top 5 for variety
  const top = data.results.slice(0, 5)
  const pick = top[Math.floor(Math.random() * top.length)]
  const imageUrl = pick.urls.raw + '&w=1600&q=90&fit=crop&crop=center'

  console.log('Image:', imageUrl.slice(0, 80) + '...')
  console.log('Photo by:', pick.user.name)

  // Set image on hero only, clear all others
  articles.forEach(a => {
    a.image_url = (a.slug === hero.slug) ? imageUrl : null
  })

  writeFileSync('public/articles.json', JSON.stringify(articles, null, 2))
  console.log('Done.')
}

searchUnsplash().catch(e => {
  console.log('Error:', e.message)
  process.exit(0)
})
