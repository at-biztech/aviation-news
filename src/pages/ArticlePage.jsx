import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { loadArticles, sortByDate } from '../data'

function ChartRenderer({ chartData }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!chartData || !canvasRef.current) return

    let cancelled = false

    const render = () => {
      if (cancelled || !window.Chart) return
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      const bc = ['rgba(230,156,125,0.8)','rgba(96,70,149,0.8)','rgba(135,68,146,0.7)','rgba(247,185,152,0.75)','rgba(65,38,128,0.75)']
      const brc = ['#E69C7D','#604695','#874492','#F7B998','#412680']
      const gc = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
      const tc = isDark ? '#A292BE' : '#54267D'

      const datasets = chartData.datasets.map((dd) => ({
        label: dd.label,
        data: dd.data,
        backgroundColor: chartData.type === 'line' ? 'rgba(230,156,125,0.12)' : bc,
        borderColor: chartData.type === 'line' ? '#E69C7D' : brc,
        borderWidth: chartData.type === 'line' ? 2 : 1,
        borderRadius: chartData.type === 'bar' ? 3 : 0,
        fill: chartData.type === 'line',
        tension: 0.3,
        pointBackgroundColor: '#E69C7D',
        pointBorderColor: isDark ? '#1E1530' : '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      }))

      if (chartRef.current) chartRef.current.destroy()

      chartRef.current = new window.Chart(canvasRef.current, {
        type: chartData.type || 'bar',
        data: { labels: chartData.labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDark ? '#2A1D42' : '#FFFFFF',
              titleColor: isDark ? '#F2EEF7' : '#1C1128',
              bodyColor: isDark ? '#D4C8E6' : '#3A2858',
              borderColor: isDark ? 'rgba(96,70,149,0.25)' : 'rgba(60,40,100,0.14)',
              borderWidth: 1,
              cornerRadius: 6,
              padding: 10,
              bodyFont: { family: 'Inter', size: 12 },
              titleFont: { family: 'Inter', size: 12, weight: '600' },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: tc, font: { family: 'Inter', size: 11 }, maxRotation: 45 }, border: { color: gc } },
            y: { grid: { color: gc }, ticks: { color: tc, font: { family: 'Inter', size: 11 } }, border: { display: false }, beginAtZero: true },
          },
        },
      })
    }

    // Load Chart.js if not present
    if (!window.Chart) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js'
      script.onload = render
      document.head.appendChild(script)
    } else {
      render()
    }

    return () => {
      cancelled = true
      if (chartRef.current) chartRef.current.destroy()
    }
  }, [chartData])

  if (!chartData) return null
  return (
    <section className="chart-section">
      <h3 className="chart-title">{chartData.title}</h3>
      <div className="chart-container">
        <canvas ref={canvasRef}></canvas>
      </div>
    </section>
  )
}

export default function ArticlePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [article, setArticle] = useState(null)

  useEffect(() => {
    loadArticles().then((all) => {
      setArticles(all)
      const found = all.find((a) => a.slug === decodeURIComponent(slug))
      setArticle(found || null)
    })
  }, [slug])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!article) {
    return (
      <>
        <Header showBack />
        <main className="article-main">
          <div className="article-wrapper">
            <div className="empty-state">
              <p>Статья не найдена</p>
            </div>
          </div>
        </main>
        <Footer showBackLink />
      </>
    )
  }

  const sorted = sortByDate(articles)
  const idx = sorted.findIndex((a) => a.slug === article.slug)
  const prevArticle = idx > 0 ? sorted[idx - 1] : null
  const nextArticle = idx < sorted.length - 1 ? sorted[idx + 1] : null

  const related = articles
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 3)

  const cm = article.category_meta

  return (
    <>
      <Header showBack />

      <main className="article-main">
        <div className="article-wrapper">
          <div className="article-header-block">
            <div className="article-meta-row">
              <span className="category-tag" style={{ '--tag-color': cm.color }}>{cm.label}</span>
              {article.impact === 'high' && <span className="high-importance-tag">ВЫСОКАЯ ВАЖНОСТЬ</span>}
              <time className="article-date">{article.formatted_date}</time>
            </div>
            <h1 className="article-title">{article.title}</h1>
          </div>

          {article.image_url && (
            <div className="article-hero-image-wrap">
              <img
                src={article.image_url}
                alt=""
                className="article-hero-image"
                loading="eager"
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="article-layout">
            <div className="article-body">
              <section className="report-section">
                <h2 className="section-heading">Обзор</h2>
                <p className="section-body">{article.overview}</p>
              </section>

              <div className="section-rule"></div>

              <section className="report-section">
                <h2 className="section-heading">Детали</h2>
                {article.details.map((d, i) => (
                  <div key={i} className="detail-block">
                    <h3 className="detail-heading">{d.header}</h3>
                    <p className="detail-content">{d.content}</p>
                  </div>
                ))}
              </section>

              <div className="section-rule"></div>

              <ChartRenderer chartData={article.chart_data} />
              {article.chart_data && <div className="section-rule"></div>}

              <section className="report-section sources-section">
                <h2 className="section-heading">Источники</h2>
                <ul className="sources-list">
                  {article.sources.map((s, i) => (
                    <li key={i} className="source-item">
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="source-link">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                        </svg>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="article-sidebar">
              <div className="insight-card insight-executive">
                <div className="insight-label">Значение для руководства</div>
                <p className="insight-text">{article.executive_relevance}</p>
              </div>

              <div className="insight-card insight-market">
                <div className="insight-label">Влияние на рынок</div>
                <p className="insight-text">{article.market_impact}</p>
              </div>

              <div className="insight-card insight-next">
                <div className="insight-label">Что дальше</div>
                <p className="insight-text">{article.next_steps}</p>
              </div>

              {related.length > 0 && (
                <div className="sidebar-related">
                  <div className="insight-label">По теме</div>
                  {related.map((rel) => (
                    <Link key={rel.slug} to={`/article/${rel.slug}`} className="related-link">
                      <span className="related-date">{rel.short_date}</span>
                      <span className="related-title">{rel.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>

          <nav className="article-nav">
            {prevArticle ? (
              <Link to={`/article/${prevArticle.slug}`} className="nav-link nav-prev">
                <span className="nav-direction">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 2L4 8l6 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Предыдущая
                </span>
                <span className="nav-title">{prevArticle.title}</span>
              </Link>
            ) : <div></div>}
            {nextArticle ? (
              <Link to={`/article/${nextArticle.slug}`} className="nav-link nav-next">
                <span className="nav-direction">
                  Следующая
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="nav-title">{nextArticle.title}</span>
              </Link>
            ) : <div></div>}
          </nav>
        </div>
      </main>

      <Footer showBackLink />
    </>
  )
}
