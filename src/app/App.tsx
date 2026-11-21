import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Link, Outlet, Route, Routes, useLocation, useOutletContext, useParams } from 'react-router-dom'
import { tools } from '../data/tools'
import { useFavorites } from '../hooks/useFavorites'
import { ToastProvider } from '../components/Toast'
import { Navbar } from '../components/Navbar'
import { SearchPalette } from '../components/SearchPalette'
import { Brand, EmptyState, Icon } from '../components/ui'
import { AboutPage, CategoryPage, FavoritesPage, HomePage, NotFoundPage, PrivacyPage, ToolsPage } from './Pages'

const ToolPage = lazy(() => import('./ToolPage'))
const validIds = tools.map((tool) => tool.id)

class ToolErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; resetKey: number }> {
  state = { failed: false, resetKey: 0 }
  static getDerivedStateFromError() { return { failed: true, resetKey: 0 } }
  render() {
    if (this.state.failed) return <div className="container tool-content"><EmptyState icon="TriangleAlert" title="This tool hit an unexpected error" message="Your data was not saved. Reset the page and try again with a smaller or simpler input." action={<button className="button button-primary" onClick={() => this.setState((state) => ({ failed: false, resetKey: state.resetKey + 1 }))}><Icon name="RotateCcw" />Reset tool</button>} /></div>
    return <div key={this.state.resetKey}>{this.props.children}</div>
  }
}

function RouteAnnouncer() {
  const location = useLocation()
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const heading = document.querySelector<HTMLElement>('main h1')
      if (heading) {
        heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: true })
        setAnnouncement(`${heading.textContent?.replace(/\s+/g, ' ').trim() ?? 'Page'} loaded`)
      }
    }, 20)
    return () => window.clearTimeout(timer)
  }, [location.pathname])
  return <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
}

function Footer() {
  const year = new Date().getFullYear()
  return <footer className="footer"><div className="container footer-inner">
    <div><Brand /><p className="footer-copy">A free, private collection of small tools for everyday digital work.</p></div>
    <nav className="footer-links" aria-label="Footer navigation"><Link to="/tools">Explore tools</Link><Link to="/#categories">Categories</Link><Link to="/about">About</Link><Link to="/privacy">Privacy</Link></nav>
  </div><div className="container copyright">© {year} DARK DEVTOOLS. Made for useful work.</div></footer>
}

function Layout() {
  const [searchOpen, setSearchOpen] = useState(false)
  const { favorites, toggle, unavailable } = useFavorites(validIds)
  const location = useLocation()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      } else if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const target = event.target as HTMLElement
        const isTyping = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
        if (!isTyping) { event.preventDefault(); setSearchOpen(true) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => setSearchOpen(false), [location.pathname])
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Navbar onSearch={() => setSearchOpen(true)} />
    {unavailable && <div className="storage-notice" role="status"><Icon name="Info" size={14} />Browser storage is unavailable. Favorites will not persist after you leave.</div>}
    <div className="page-main"><Outlet context={{ favorites, toggle, onSearch: () => setSearchOpen(true) }} /></div>
    <Footer />
    <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    <RouteAnnouncer />
  </div>
}

type OutletValues = { favorites: string[]; toggle: (id: string) => void; onSearch: () => void }

function usePageProps() {
  return useOutletContext<OutletValues>()
}
function HomeRoute() {
  const { favorites, toggle, onSearch } = usePageProps()
  return <HomePage favorites={favorites} toggleFavorite={toggle} onSearch={onSearch} />
}
function ToolsRoute() {
  const { favorites, toggle, onSearch } = usePageProps()
  return <ToolsPage favorites={favorites} toggleFavorite={toggle} onSearch={onSearch} />
}
function CategoryRoute() {
  const { favorites, toggle, onSearch } = usePageProps()
  return <CategoryPage favorites={favorites} toggleFavorite={toggle} onSearch={onSearch} />
}
function FavoritesRoute() {
  const { favorites, toggle, onSearch } = usePageProps()
  return <FavoritesPage favorites={favorites} toggleFavorite={toggle} onSearch={onSearch} />
}
function NotFoundRoute() {
  const { onSearch } = usePageProps()
  return <NotFoundPage onSearch={onSearch} />
}
function ToolRoute() {
  const { favorites, toggle } = useOutletContext<OutletValues>()
  const { slug } = useParams()
  return <Suspense fallback={<div className="container tool-content"><p className="status-line"><Icon name="LoaderCircle" />Loading tool…</p></div>}><ToolErrorBoundary key={slug}><ToolPage favorites={favorites} toggleFavorite={toggle} /></ToolErrorBoundary></Suspense>
}

export default function App() {
  useEffect(() => {
    const splash = document.getElementById('boot-splash')
    if (!splash) return
    let timeout: number | undefined
    const frame = window.requestAnimationFrame(() => {
      splash.classList.add('is-ready')
      timeout = window.setTimeout(() => splash.remove(), 220)
    })
    return () => {
      window.cancelAnimationFrame(frame)
      if (timeout !== undefined) window.clearTimeout(timeout)
    }
  }, [])

  return <BrowserRouter><ToastProvider><Routes>
    <Route element={<Layout />}>
      <Route index element={<HomeRoute />} />
      <Route path="tools" element={<ToolsRoute />} />
      <Route path="category/:category" element={<CategoryRoute />} />
      <Route path="tools/:slug" element={<ToolRoute />} />
      <Route path="favorites" element={<FavoritesRoute />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="privacy" element={<PrivacyPage />} />
      <Route path="404" element={<NotFoundRoute />} />
      <Route path="*" element={<NotFoundRoute />} />
    </Route>
  </Routes></ToastProvider></BrowserRouter>
}
