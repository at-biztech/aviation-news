// Category metadata
export const CATEGORIES = {
  'Деловая авиация': { color: '#604695', label: 'Деловая авиация' },
  'Геополитика и регулирование': { color: '#935E48', label: 'Геополитика и регулирование' },
  'Технологии': { color: '#412680', label: 'Технологии' },
  'Чартерные перевозки': { color: '#54267D', label: 'Чартерные перевозки' },
  'Цепочки поставок': { color: '#663B8E', label: 'Цепочки поставок' },
  'Рынок и экономика': { color: '#E69C7D', label: 'Рынок и экономика' },
}

const IMPACT_WEIGHT = { high: 3, medium: 2, low: 1 }

const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
const MONTHS_SHORT = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек']

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`
}

export function shortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

export function sourcesWord(n) {
  const num = parseInt(n, 10) || 0
  const ld = num % 10, lt = num % 100
  if (ld === 1 && lt !== 11) return num + ' источник'
  if (ld >= 2 && ld <= 4 && (lt < 12 || lt > 14)) return num + ' источника'
  return num + ' источников'
}

export function articlesWord(n) {
  const ld = n % 10, lt = n % 100
  if (ld === 1 && lt !== 11) return n + ' статья'
  if (ld >= 2 && ld <= 4 && (lt < 12 || lt > 14)) return n + ' статьи'
  return n + ' статей'
}

export function enrichArticle(a) {
  const cat = CATEGORIES[a.category] || { color: '#604695', label: a.category }
  const sources = Array.isArray(a.sources) ? a.sources : []
  return {
    ...a,
    category_meta: cat,
    formatted_date: formatDate(a.publication_date),
    short_date: shortDate(a.publication_date),
    source_count: sources.length,
    impact_label: a.impact === 'high' ? 'Высокая' : a.impact === 'medium' ? 'Средняя' : 'Низкая',
    details: Array.isArray(a.details) ? a.details : [],
    sources,
    chart_data: a.chart_data || null,
  }
}

// Sort by date (newest first), used for feed
export function sortByDate(articles) {
  return [...articles].sort((a, b) => b.publication_date.localeCompare(a.publication_date))
}

// Sort by impact then date, used for hero selection
export function sortByImpact(articles) {
  return [...articles].sort((a, b) => {
    const wA = IMPACT_WEIGHT[a.impact] || 0
    const wB = IMPACT_WEIGHT[b.impact] || 0
    if (wB !== wA) return wB - wA
    return b.publication_date.localeCompare(a.publication_date)
  })
}

let _articles = null

export async function loadArticles() {
  if (_articles) return _articles
  const base = import.meta.env.BASE_URL || '/'
  const res = await fetch(`${base}articles.json`)
  const raw = await res.json()
  _articles = raw.map(enrichArticle)
  return _articles
}
