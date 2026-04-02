import { Routes, Route } from 'react-router-dom'
import IndexPage from './pages/IndexPage'
import ArticlePage from './pages/ArticlePage'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/article/:slug" element={<ArticlePage />} />
    </Routes>
  )
}
