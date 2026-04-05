import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { loadArticles, sortByDate, sortByImpact, CATEGORIES, sourcesWord, articlesWord } from '../data'

const HERO_FALLBACK_IMAGES = {
  'Деловая авиация': 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&q=90',
  'Геополитика и регулирование': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1600&q=90',
  'Технологии': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&q=90',
  'Чартерные перевозки': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1600&q=90',
  'Цепочки поставок': 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1600&q=90',
  'Рынок и экономика': 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1600&q=90',
}
const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1600&q=90'

function HeroImage({ src, category }) {
  const [tryCount, setTryCount] = useState(0)
  const fallback = HERO_FALLBACK_IMAGES[category] || DEFAULT_HERO_IMAGE
  const imgUrl = tryCount === 0 ? (src || fallback) : tryCount === 1 ? fallback : DEFAULT_HERO_IMAGE
  return (
    <div className="hero-image-wrap">
      <img
        src={imgUrl}
        alt=""
        className="hero-image"
        loading="eager"
        onError={() => { if (tryCount < 2) setTryCount(tryCount + 1) }}
      />
    </div>
  )
}

function HeroSection({ articles, onNavigate }) {
  if (articles.length === 0) return null
  const hero = articles[0]
  const sidebar = articles.slice(1, 4)
  const cm = hero.category_meta

  return (
    <section className="hero-section">
      <div className="hero-grid">
        <article className="hero-main" onClick={() => onNavigate(hero.slug)}>
          <HeroImage src={hero.image_url} category={hero.category} />
          <div className="hero-text">
            <div className="hero-meta">
              <span className="category-tag" style={{ '--tag-color': cm.color }}>{cm.label}</span>
              {hero.impact === 'high' && <span className="high-importance-tag">ВЫСОКАЯ ВАЖНОСТЬ</span>}
            </div>
            <h1 className="hero-title">{hero.title}</h1>
            <p className="hero-summary">{hero.summary}</p>
            <div className="hero-footer">
              <time className="hero-date">{hero.formatted_date}</time>
              <span className="hero-sources">{sourcesWord(hero.source_count)}</span>
              <span className="hero-read">Читать отчёт</span>
            </div>
          </div>
        </article>
        {sidebar.length > 0 && (
          <aside className="hero-sidebar">
            <div className="sidebar-label">Также важно</div>
            {sidebar.map((a) => (
              <article key={a.slug} className="sidebar-card" onClick={() => onNavigate(a.slug)}>
                <div className="sidebar-card-meta">
                  <span className="category-dot" style={{ background: a.category_meta.color }}></span>
                  <span className="sidebar-category">{a.category_meta.label}</span>
                  <span className="sidebar-date">{a.short_date}</span>
                </div>
                <h3 className="sidebar-title">{a.title}</h3>
              </article>
            ))}
          </aside>
        )}
      </div>
    </section>
  )
}

function NewsCard({ article, onNavigate }) {
  const cm = article.category_meta
  return (
    <article className="news-card" onClick={() => onNavigate(article.slug)}>
      <div className="card-top">
        <div className="card-meta">
          <span className="category-tag category-tag--sm" style={{ '--tag-color': cm.color }}>{cm.label}</span>
          {article.impact === 'high' && <span className="high-importance-tag">ВЫСОКАЯ ВАЖНОСТЬ</span>}
        </div>
        <time className="card-date">{article.short_date}</time>
      </div>
      <h3 className="card-title">{article.title}</h3>
      <p className="card-summary">{article.summary}</p>
      <div className="card-bottom">
        <span className="card-sources">{sourcesWord(article.source_count)}</span>
        <span className="card-right">
          <span className="card-read">Подробнее</span>
        </span>
      </div>
    </article>
  )
}

export default function IndexPage() {
  const [articles, setArticles] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadArticles().then(setArticles)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        document.querySelector('.search-input')?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const catCounts = useMemo(() => {
    const counts = {}
    articles.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1
    })
    return counts
  }, [articles])

  // Feed: sorted by date (newest first)
  const sorted = useMemo(() => sortByDate(articles), [articles])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return sorted.filter((a) => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory
      if (!matchCat) return false
      if (!q) return true
      return (
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        (a.overview || '').toLowerCase().includes(q) ||
        a.category_meta.label.toLowerCase().includes(q)
      )
    })
  }, [sorted, activeCategory, searchQuery])

  // Hero: most impactful from last 7 days, fill remaining from most impactful overall
  const showHero = activeCategory === 'all' && !searchQuery
  const heroArticles = useMemo(() => {
    if (!showHero || filtered.length === 0) return []

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Start with last 7 days, sorted by impact
    const recent = sortByImpact(
      filtered.filter((a) => new Date(a.publication_date + 'T00:00:00') >= sevenDaysAgo)
    )

    // If we have 4+, use them
    if (recent.length >= 4) return recent.slice(0, 4)

    // Fill remaining slots from most impactful overall (avoiding duplicates)
    const recentSlugs = new Set(recent.map((a) => a.slug))
    const fallback = sortByImpact(filtered).filter((a) => !recentSlugs.has(a.slug))
    const combined = [...recent, ...fallback]
    return combined.slice(0, 4)
  }, [filtered, showHero])

  const heroSlugs = useMemo(() => {
    return new Set(heroArticles.map((a) => a.slug))
  }, [heroArticles])

  const feedArticles = useMemo(() => {
    return filtered.filter((a) => !heroSlugs.has(a.slug))
  }, [filtered, heroSlugs])

  const goTo = useCallback((slug) => navigate(`/article/${slug}`), [navigate])

  const feedTitle = activeCategory !== 'all'
    ? `${CATEGORIES[activeCategory]?.label || activeCategory} новости`
    : 'Остальные новости'

  return (
    <>
      <Header
        showSearch
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
      />

      <nav className="filters-bar">
        <div className="filters-inner">
          <div className="filter-section filter-categories">
            <button
              className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              Все <span className="chip-count">{articles.length}</span>
            </button>
            {Object.entries(CATEGORIES).map(([name, meta]) => {
              const count = catCounts[name] || 0
              if (count === 0) return null
              return (
                <button
                  key={name}
                  className={`filter-chip ${activeCategory === name ? 'active' : ''}`}
                  style={{ '--chip-accent': meta.color }}
                  onClick={() => setActiveCategory(name)}
                >
                  {meta.label} <span className="chip-count">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {showHero && heroArticles.length > 0 && <HeroSection articles={heroArticles} onNavigate={goTo} />}

        <section className="feed-section">
          <div className="feed-header">
            <h2 className="feed-label">{feedTitle}</h2>
            <span className="feed-count">{articlesWord(feedArticles.length)}</span>
          </div>

          {feedArticles.length > 0 ? (
            <div className="feed-grid">
              {feedArticles.map((a) => (
                <NewsCard key={a.slug} article={a} onNavigate={goTo} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 12h10"/>
              </svg>
              <p>Нет новостей для отображения</p>
            </div>
          )}
        </section>
      </main>

      <Footer totalArticles={articles.length} />
    </>
  )
}
