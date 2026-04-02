import { Link } from 'react-router-dom'

function ThemeToggle() {
  const toggle = () => {
    const html = document.documentElement
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    html.setAttribute('data-theme', next)
    localStorage.setItem('air-tengri-theme', next)
  }

  return (
    <button className="theme-toggle" title="Переключить тему" onClick={toggle}>
      <svg className="icon-sun" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
      <svg className="icon-moon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
  )
}

export default function Header({ showSearch, searchQuery, onSearch, onClearSearch, showBack }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="logo-link">
          <img src={`${import.meta.env.BASE_URL}logo-light.png`} alt="Air Tengri" className="logo-img logo-dark-mode" width="60" height="30" />
          <img src={`${import.meta.env.BASE_URL}logo-dark.png`} alt="Air Tengri" className="logo-img logo-light-mode" width="60" height="30" />
          <div className="logo-text">
            <span className="logo-name">AIR TENGRI</span>
            <span className="logo-divider"></span>
            <span className="logo-subtitle">Новости деловой авиации</span>
          </div>
        </Link>
        <div className="header-right">
          {showBack && (
            <Link to="/" className="back-link">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 2L4 8l6 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              К ленте новостей
            </Link>
          )}
          {showSearch && (
            <div className="search-wrapper">
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Поиск..."
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && onClearSearch()}
              />
              {searchQuery && (
                <button className="search-clear" onClick={onClearSearch}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
