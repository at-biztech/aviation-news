import { Link } from 'react-router-dom'

export default function Footer({ totalArticles, showBackLink }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-brand">Air Tengri News Platform</span>
        <span className="footer-sep"></span>
        {showBackLink ? (
          <Link to="/" className="footer-link">Вернуться к ленте</Link>
        ) : (
          <span>{totalArticles} {totalArticles === 1 ? 'статья' : totalArticles < 5 ? 'статьи' : 'статей'} в базе</span>
        )}
      </div>
    </footer>
  )
}
