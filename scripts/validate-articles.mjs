#!/usr/bin/env node
/**
 * Validates and normalizes new-articles.json before merging into articles.json.
 * Run: node scripts/validate-articles.mjs
 */
import { readFileSync, writeFileSync } from 'fs'

const CATEGORIES = [
  'Деловая авиация',
  'Геополитика и регулирование',
  'Технологии',
  'Чартерные перевозки',
  'Цепочки поставок',
  'Рынок и экономика'
]

const IMPACTS = ['high', 'medium', 'low']

const REQUIRED = ['title', 'category', 'impact', 'summary', 'publication_date', 'executive_relevance', 'overview', 'details', 'market_impact', 'next_steps', 'sources']

function makeSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
}

try {
  const raw = readFileSync('scripts/new-articles.json', 'utf8')
  const articles = JSON.parse(raw)

  if (!Array.isArray(articles)) throw new Error('new-articles.json must be an array')

  const validated = []

  for (const [i, a] of articles.entries()) {
    // Check required fields
    for (const f of REQUIRED) {
      if (!a[f] && a[f] !== 0) {
        console.warn(`Article ${i}: missing field "${f}", skipping`)
        continue
      }
    }

    // Fix category
    if (!CATEGORIES.includes(a.category)) {
      const match = CATEGORIES.find(c => a.category.includes(c))
      if (match) {
        a.category = match
      } else {
        console.warn(`Article ${i}: unknown category "${a.category}", defaulting to first`)
        a.category = CATEGORIES[0]
      }
    }

    // Fix impact
    if (!IMPACTS.includes(a.impact)) {
      a.impact = 'medium'
    }

    // Ensure slug
    if (!a.slug) {
      a.slug = makeSlug(a.title)
    }

    // Ensure arrays
    if (!Array.isArray(a.details)) a.details = []
    if (!Array.isArray(a.sources)) a.sources = []

    // Ensure details have correct shape
    a.details = a.details.filter(d => d && d.header && d.content)

    // Ensure sources have correct shape
    a.sources = a.sources.filter(s => s && s.title && s.url)

    // Ensure chart_data is valid or null
    if (a.chart_data && (!a.chart_data.labels || !a.chart_data.datasets)) {
      a.chart_data = null
    }

    // Remove server-only fields
    delete a.id
    delete a.created_at
    delete a.updated_at

    validated.push(a)
  }

  writeFileSync('scripts/new-articles.json', JSON.stringify(validated, null, 2))
  console.log(`Validated ${validated.length} articles`)
  process.exit(0)
} catch (e) {
  console.error('Validation error:', e.message)
  process.exit(1)
}
