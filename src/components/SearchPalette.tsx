import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tools } from '../data/tools'
import { categories } from '../data/categories'
import { searchTools } from '../utils/search'
import { Icon } from './ui'

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const results = useMemo(() => searchTools(query, tools).slice(0, 9), [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      window.setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => { setActive(0) }, [query])

  if (!open) return null
  const select = (index: number) => {
    const tool = results[index]
    if (!tool) return
    navigate(`/tools/${tool.slug}`)
    onClose()
  }
  return <div className="search-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Search tools" onKeyDown={(event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive((index) => (index + 1) % Math.max(results.length, 1)) }
      if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => (index - 1 + results.length) % Math.max(results.length, 1)) }
      if (event.key === 'Enter') { event.preventDefault(); select(active) }
      if (event.key === 'Tab') {
        const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('input,button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')]
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }}>
      <div className="search-box"><Icon name="Search" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 50 tools..." aria-label="Search all tools" /><kbd className="keycap">ESC</kbd></div>
      <div className="search-results" role="listbox" aria-label="Search results">
        {results.map((tool, index) => {
          const category = categories.find((item) => item.id === tool.category)
          return <button className={`search-result${index === active ? ' selected' : ''}`} role="option" aria-selected={index === active} key={tool.id} onMouseEnter={() => setActive(index)} onClick={() => select(index)}>
            <span className="tool-icon"><Icon name={tool.icon} size={16} /></span>
            <span className="search-result-copy"><strong>{tool.name}</strong><span>{tool.description}</span></span>
            <span className="category-badge">{category?.label}</span>
          </button>
        })}
        {!results.length && <div className="empty-state" style={{ minHeight: 150, border: 0 }}><Icon name="SearchX" /><h2>No tools found</h2><p>Try a different word or browse all tools.</p></div>}
      </div>
      <div className="search-footer"><span>{results.length} result{results.length === 1 ? '' : 's'} {query && `for “${query}”`}</span><span>↑↓ navigate · ↵ open · esc close</span></div>
      <span className="sr-only" aria-live="polite">{results.length} search results</span>
    </section>
  </div>
}
