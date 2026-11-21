import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Brand, Icon } from './ui'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/tools', label: 'Explore tools' },
  { to: '/#categories', label: 'Categories' },
  { to: '/about', label: 'About' },
]

export function Navbar({ onSearch }: { onSearch: () => void }) {
  const [drawer, setDrawer] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const drawerPanel = useRef<HTMLElement>(null)
  const location = useLocation()
  useEffect(() => setDrawer(false), [location.pathname, location.hash])
  useEffect(() => {
    if (!drawer) return
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusFirst = () => drawerPanel.current?.querySelector<HTMLElement>('a[href],button:not([disabled])')?.focus()
    focusFirst()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setDrawer(false); menuButton.current?.focus(); return }
      if (event.key !== 'Tab' || !drawerPanel.current) return
      const focusable = [...drawerPanel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')]
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', onKeyDown) }
  }, [drawer])
  return <>
    <header className="navbar">
      <div className="container nav-inner">
        <Brand />
        <nav className="nav-links" aria-label="Main navigation">
          {links.map((link) => link.to === '/#categories'
            ? <Link className="nav-link" key={link.label} to={link.to}>{link.label}</Link>
            : <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} key={link.label} to={link.to} end={link.end}>{link.label}</NavLink>)}
          <button className="nav-button" onClick={onSearch}><Icon name="Search" size={16} /> Search <kbd className="keycap">/</kbd></button>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/favorites"><Icon name="Heart" size={16} /> Favorites</NavLink>
        </nav>
        <button ref={menuButton} className="nav-icon-btn mobile-menu-button" aria-label={drawer ? 'Close menu' : 'Open menu'} aria-expanded={drawer} aria-controls="mobile-navigation" onClick={() => setDrawer(!drawer)}><Icon name={drawer ? 'X' : 'Menu'} /></button>
      </div>
    </header>
    {drawer && <div className="mobile-drawer" onMouseDown={(event) => { if (event.target === event.currentTarget) setDrawer(false) }}>
      <nav ref={drawerPanel} className="drawer-panel" id="mobile-navigation" aria-label="Mobile navigation">
        <div className="drawer-links">
          {links.map((link) => link.to === '/#categories'
            ? <Link className="nav-link" key={link.label} to={link.to}><Icon name="Shapes" size={17} />{link.label}</Link>
            : <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} key={link.label} to={link.to} end={link.end}>{link.label}</NavLink>)}
          <button className="nav-button" onClick={() => { setDrawer(false); onSearch() }}><Icon name="Search" size={17} /> Search all tools</button>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/favorites"><Icon name="Heart" size={17} /> Favorites</NavLink>
          <Link className="nav-link" to="/privacy"><Icon name="ShieldCheck" size={17} /> Privacy</Link>
        </div>
      </nav>
    </div>}
  </>
}
