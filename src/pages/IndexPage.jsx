import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { loadArticles, sortArticles, CATEGORIES, sourcesWord, articlesWord } from '../data'

function ImgWithFallback({ src, alt, className, loading }) {
  const [error, setError] = useState(false)
  if (!src || error) return null
  return (
    <div className={className === 'hero-image' ? 'hero-image-wrap' : 'card-thumbnail-wrap'}>
      <img src={src} alt={alt} className={className} loading={loading} onError={() => setError(true)} />
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
          <ImgWithFallback src={hero.image_url} className="hero-image" loading="eager" />
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
      </div>
    </section>
  )
}

function NewsCard({ article, onNavigate }) {
  const cm = article.category_meta
  return (
    <article className="news-card" onClick={() => onNavigate(article.slug)}>
      <ImgWithFallback src={article.image_url} className="card-thumbnail" loading="lazy" />
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

  const sorted = useMemo(() => sortArticles(articles), [articles])

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

  const showHero = activeCategory === 'all' && !searchQuery
  const heroSlugs = useMemo(() => {
    if (!showHero) return new Set()
    return new Set(filtered.slice(0, 4).map((a) => a.slug))
  }, [filtered, showHero])

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
        {showHero && <HeroSection articles={filtered} onNavigate={goTo} />}

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
