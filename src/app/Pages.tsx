import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { categories, type CategoryId } from '../data/categories'
import { tools, type Tool } from '../data/tools'
import { useToast } from '../hooks/useToast'
import { EmptyState, Icon, SectionHeading, ToolCard } from '../components/ui'
import { searchTools } from '../utils/search'

type PageProps = { favorites: string[]; toggleFavorite: (id: string) => void; onSearch: () => void }

export function PageMeta({ title, description, schema }: { title: string; description: string; schema?: Record<string, unknown> }) {
  const location = useLocation()
  const schemaJson = schema ? JSON.stringify(schema) : ''
  useEffect(() => {
    document.title = `${title} | DARK DEVTOOLS`
    const root = (import.meta.env.SITE_URL ?? window.location.origin).replace(/\/+$/, '')
    const setMeta = (selector: string, attributes: Record<string, string>, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector)
      if (!element) {
        element = document.createElement('meta')
        Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value))
        document.head.append(element)
      }
      element.content = content
    }
    setMeta('meta[name="description"]', { name: 'description' }, description)
    setMeta('meta[name="robots"]', { name: 'robots' }, 'index,follow')
    setMeta('meta[property="og:title"]', { property: 'og:title' }, `${title} | DARK DEVTOOLS`)
    setMeta('meta[property="og:description"]', { property: 'og:description' }, description)
    setMeta('meta[property="og:type"]', { property: 'og:type' }, 'website')
    setMeta('meta[property="og:image"]', { property: 'og:image' }, `${root}/og-image.svg`)
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image')
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, `${title} | DARK DEVTOOLS`)
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description)
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, `${root}/og-image.svg`)
    const base = import.meta.env.SITE_URL?.replace(/\/+$/, '')
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (base) {
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical) }
      canonical.href = `${base}${location.pathname}`
    } else canonical?.remove()
    document.head.querySelector('script[data-site-schema]')?.remove()
    if (schemaJson) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.siteSchema = 'true'
      script.textContent = schemaJson
      document.head.append(script)
    }
  }, [title, description, location.pathname, schemaJson])
  return null
}

function InlineSearch({ value, onChange, placeholder = 'Search tools…' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <div className="search-box"><Icon name="Search" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label="Search tools" />{value && <button className="icon-action" onClick={() => onChange('')} aria-label="Clear search"><Icon name="X" /></button>}</div>
}

function CategoryCard({ category }: { category: (typeof categories)[number] }) {
  const count = tools.filter((tool) => tool.category === category.id).length
  return <Link to={`/category/${category.id}`} className="category-card">
    <span className="tool-icon"><Icon name={category.icon} /></span>
    <div><h3>{category.label}</h3><p>{category.description}</p><span className="category-count">{count} tools <Icon name="ArrowRight" size={12} /></span></div>
  </Link>
}

function CardSection({ title, description, collection, favorites, toggleFavorite, action }: { title: string; description?: string; collection: Tool[]; favorites: string[]; toggleFavorite: (id: string) => void; action?: React.ReactNode }) {
  if (!collection.length) return null
  return <section className="section"><SectionHeading title={title} description={description} action={action} /><div className="card-grid">{collection.map((tool) => <ToolCard key={tool.id} tool={tool} favorite={favorites.includes(tool.id)} onToggle={toggleFavorite} />)}</div></section>
}

export function HomePage({ favorites, toggleFavorite, onSearch }: PageProps) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => searchTools(query, tools).slice(0, 6), [query])
  const featured = tools.filter((tool) => tool.featured)
  const popular = tools.filter((tool) => tool.popular)
  return <>
    <PageMeta title="Your Everyday Digital Toolbox" description="Fast, free, privacy-first browser tools for developers, creators, students and everyone." schema={{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'DARK DEVTOOLS', url: import.meta.env.SITE_URL || window.location.origin }} />
    <main className="container" id="main-content">
      <section className="hero">
        <span className="eyebrow"><span className="status-dot" /> 50 thoughtful tools · free to use</span>
        <h1>Your Everyday<br /><span>Digital Toolbox.</span></h1>
        <p className="hero-copy">Powerful, free and easy-to-use tools for developers, creators, students and everyone. Get useful work done without leaving your browser.</p>
        <div className="hero-search"><InlineSearch value={query} onChange={setQuery} placeholder="What would you like to do?" /></div>
        {query ? <div className="hero-chips" aria-live="polite">{filtered.length ? filtered.map((tool) => <Link key={tool.id} className="chip" to={`/tools/${tool.slug}`}>{tool.name}</Link>) : <span>No matching tools yet.</span>}{filtered.length > 0 && <Link className="text-link" to="/tools">View all <Icon name="ArrowRight" size={13} /></Link>}</div> : <>
          <div className="hero-actions"><Link className="button button-primary" to="/tools"><Icon name="Command" size={16} />Explore all tools<Icon name="ArrowRight" size={15} /></Link><button className="button" onClick={onSearch}><Icon name="Search" size={16} />Quick search <kbd className="keycap">/</kbd></button></div>
          <div className="hero-chips"><span>Popular:</span>{popular.slice(0, 4).map((tool) => <Link className="chip" key={tool.id} to={`/tools/${tool.slug}`}>{tool.name}</Link>)}</div>
        </>}
        <div className="privacy-note"><Icon name="ShieldCheck" />Your input stays in your browser. No sign-up, no tracking.</div>
      </section>
      <CardSection title="Featured tools" description="A few favorites to get you started." collection={featured} favorites={favorites} toggleFavorite={toggleFavorite} action={<Link className="text-link" to="/tools">Browse all <Icon name="ArrowRight" size={14} /></Link>} />
      <section className="section" id="categories"><SectionHeading title="Browse categories" description="Find the right utility for the task at hand." /><div className="category-grid">{categories.map((category) => <CategoryCard key={category.id} category={category} />)}</div></section>
      <CardSection title="Popular picks" description="Useful tools, selected by our team. No invented usage counts." collection={popular} favorites={favorites} toggleFavorite={toggleFavorite} />
      <section className="section"><SectionHeading title="Why DARK DEVTOOLS" description="Useful by default. Private by design." /><div className="why-grid">
        {[['Gift', 'Free to use', 'A useful toolkit with no account, payment or sign-up required.'], ['ShieldCheck', 'Privacy-first', 'Tool inputs are handled in your browser and are not sent to a tool backend.'], ['Zap', 'Fast & simple', 'Focused interfaces help you finish a small task and move on.'], ['Smartphone', 'Works across screens', 'Responsive layouts keep core tools accessible on mobile and desktop.']].map(([icon, title, detail]) => <article className="why-card" key={title}><Icon name={icon} /><h3>{title}</h3><p>{detail}</p></article>)}
      </div></section>
    </main>
  </>
}

export function ToolsPage({ favorites, toggleFavorite }: PageProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const results = useMemo(() => searchTools(query, tools).filter((tool) => category === 'all' || tool.category === category), [query, category])
  return <>
    <PageMeta title="Explore All Tools" description="Browse 50 free browser-based developer, text, web, color, generator and converter tools." />
    <main className="container" id="main-content">
      <header className="page-header"><div className="breadcrumbs"><Link to="/">Home</Link><Icon name="ChevronRight" size={13} /><span>Explore tools</span></div><h1 className="page-title">Explore all tools</h1><p className="page-description">A practical set of 50 browser tools. Search by name or task, then open a tool to get started.</p></header>
      <div className="explore-toolbar"><div className="explore-search"><InlineSearch value={query} onChange={setQuery} placeholder="Search by tool or task…" /></div><div className="filter-row" aria-label="Filter by category"><button className={`chip${category === 'all' ? ' active' : ''}`} onClick={() => setCategory('all')}>All tools <span>{tools.length}</span></button>{categories.map((item) => <button className={`chip${category === item.id ? ' active' : ''}`} key={item.id} onClick={() => setCategory(item.id)}><Icon name={item.icon} size={13} />{item.label} <span>{tools.filter((tool) => tool.category === item.id).length}</span></button>)}</div></div>
      <p className="results-line" aria-live="polite">Showing {results.length} of {tools.length} tools</p>
      {results.length ? <div className="card-grid">{results.map((tool) => <ToolCard key={tool.id} tool={tool} favorite={favorites.includes(tool.id)} onToggle={toggleFavorite} />)}</div> : <EmptyState title="No tools found" message="Try another search or clear the category filter." action={<button className="button" onClick={() => { setQuery(''); setCategory('all') }}>Clear filters</button>} />}
    </main>
  </>
}

export function CategoryPage({ favorites, toggleFavorite }: PageProps) {
  const { category: id = '' } = useParams()
  const category = categories.find((item) => item.id === id)
  if (!category) return <Navigate to="/404" replace />
  const collection = tools.filter((tool) => tool.category === category.id)
  return <>
    <PageMeta title={`${category.label} Tools`} description={category.description} />
    <main className="container" id="main-content">
      <header className="page-header"><div className="breadcrumbs"><Link to="/">Home</Link><Icon name="ChevronRight" size={13} /><Link to="/tools">Tools</Link><Icon name="ChevronRight" size={13} /><span>{category.label}</span></div><div className="workspace-title"><span className="tool-icon"><Icon name={category.icon} /></span><div><h1 className="page-title">{category.label} tools</h1><p className="page-description">{category.description}</p></div></div><p className="results-line">{collection.length} tools in this category</p></header>
      <div className="card-grid">{collection.map((tool) => <ToolCard key={tool.id} tool={tool} favorite={favorites.includes(tool.id)} onToggle={toggleFavorite} />)}</div>
      <div className="section"><Link className="button" to="/tools"><Icon name="ArrowLeft" />Explore all tools</Link></div>
    </main>
  </>
}

export function FavoritesPage({ favorites, toggleFavorite }: PageProps) {
  const { toast } = useToast()
  const [sort, setSort] = useState('az')
  const collection = tools.filter((tool) => favorites.includes(tool.id)).sort((a, b) => sort === 'za' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name))
  return <>
    <PageMeta title="Your Favorites" description="Your locally saved favorite tools." />
    <main className="container" id="main-content">
      <header className="page-header"><div className="breadcrumbs"><Link to="/">Home</Link><Icon name="ChevronRight" size={13} /><span>Favorites</span></div><div className="section-heading"><div><h1 className="page-title">Your favorites</h1><p>Saved on this device for quick access.</p></div>{collection.length > 1 && <label className="field"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="az">A to Z</option><option value="za">Z to A</option></select></label>}</div></header>
      {collection.length ? <div className="card-grid">{collection.map((tool) => <ToolCard key={tool.id} tool={tool} favorite onToggle={(id) => { toggleFavorite(id); toast('Removed from favorites') }} />)}</div> : <EmptyState icon="Heart" title="No favorites yet" message="Save tools with the heart button and they’ll be collected here on this device." action={<Link className="button button-primary" to="/tools">Explore tools</Link>} />}
    </main>
  </>
}

export function AboutPage() {
  return <>
    <PageMeta title="About" description="Learn about DARK DEVTOOLS and its privacy-first approach to useful browser utilities." />
    <main className="container" id="main-content"><header className="page-header"><div className="breadcrumbs"><Link to="/">Home</Link><Icon name="ChevronRight" size={13} /><span>About</span></div><h1 className="page-title">Small tools. Less friction.</h1><p className="page-description">DARK DEVTOOLS is a collection of free browser utilities made to help with everyday digital work.</p></header>
      <div className="info-grid"><article className="info-box"><h2>What we’re building</h2><p>Useful, focused tools for developers, students, makers and anyone who works with text, code, colors or numbers. No account is required and the tools are designed to work directly in your browser.</p></article><article className="info-box"><h2>Privacy by default</h2><p>Tool inputs are processed locally. The site stores only the favorites and small interface preferences you choose to save. Do not use browser tools as a substitute for a security review of sensitive data.</p></article></div>
      <section className="section"><SectionHeading title="Explore the toolbox" /><div className="category-grid">{categories.map((category) => <CategoryCard key={category.id} category={category} />)}</div></section>
    </main>
  </>
}

export function PrivacyPage() {
  return <>
    <PageMeta title="Privacy Policy" description="How DARK DEVTOOLS handles local tool inputs, favorites and standard hosting logs." />
    <main className="container" id="main-content"><header className="page-header"><div className="breadcrumbs"><Link to="/">Home</Link><Icon name="ChevronRight" size={13} /><span>Privacy</span></div><h1 className="page-title">Privacy policy</h1><p className="page-description">A plain-language explanation of what this static website does and does not store.</p></header>
      <div className="info-grid">
        <article className="info-box"><h2>Tool inputs</h2><p>Tools are implemented to process their inputs in your browser. This demo has no tool-processing backend and does not send tool input to an application API. File tools read selected files locally. Browser extensions, browser sync and your network environment are outside this site’s control.</p></article>
        <article className="info-box"><h2>Local storage</h2><p>If you favorite tools, your browser may store their IDs in localStorage under <code>darkdevtools:favorites</code>. This demo does not store passwords, generated values or tool inputs. If storage is unavailable, favorites work only for the current page session.</p></article>
        <article className="info-box"><h2>Analytics and accounts</h2><p>This project does not include analytics, advertising cookies, user accounts or third-party scripts. Fonts use local system fallbacks.</p></article>
        <article className="info-box"><h2>Hosting logs</h2><p>If this static site is deployed, the hosting provider may retain standard request logs such as IP address, request path and user-agent for operational and security purposes. See the selected provider’s own policy for details.</p></article>
      </div>
      <p className="copyright">Policy for this build · November 21, 2026</p>
    </main>
  </>
}

export function NotFoundPage({ onSearch }: { onSearch: () => void }) {
  return <>
    <PageMeta title="Page Not Found" description="The page you requested could not be found. Search the DARK DEVTOOLS collection." />
    <main className="container" id="main-content"><header className="page-header"><div className="breadcrumbs"><Link to="/">Home</Link><Icon name="ChevronRight" size={13} /><span>Not found</span></div></header><EmptyState icon="FileQuestion" title="This page wandered off." message="The link may be old or the address may be mistyped. Search all tools or head back to the homepage." action={<div className="hero-actions"><button className="button button-primary" onClick={onSearch}><Icon name="Search" />Search tools</button><Link className="button" to="/">Go home</Link></div>} /><section className="section"><SectionHeading title="Popular tools" /><div className="card-grid">{tools.filter((tool) => tool.popular).slice(0, 3).map((tool) => <ToolCard key={tool.id} tool={tool} favorite={false} onToggle={() => undefined} />)}</div></section></main>
  </>
}
