import {
  ArrowLeft, ArrowLeftRight, ArrowRight, ArrowUpRight, AtSign, Binary, Blend, Bot, Braces, CalendarClock,
  CaseSensitive, ChevronRight, CircleAlert, CircleCheck, Clock3, Code, Code2, CodeXml, Command, Contrast,
  Copy, Dices, Download, FileCode, FileCode2, FileJson2, FileQuestion, FileText, Fingerprint, FlaskConical,
  Frame, Gauge, Gift, GitCompareArrows, Globe2, Grid2X2, Hash, Heart, Image, Info, Key, KeyRound,
  LayoutPanelTop, Link as LinkIcon, Link2, ListFilter, LoaderCircle, Menu, Minimize2, Paintbrush, Palette, PanelsTopLeft,
  Percent, Pipette, QrCode, RadioTower, Regex, Replace, RotateCcw, Rows3, Ruler, Scan, Search, SearchX,
  Shapes, ShieldCheck, Shuffle, Smartphone, SquareDashed, Tags, Text, TextCursorInput, TextQuote, Trash2,
  TriangleAlert, Type, WandSparkles, Wrench, X, Zap,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Tool } from '../data/tools'
import { categories } from '../data/categories'

const icons: Record<string, LucideIcon> = {
  ArrowLeft, ArrowLeftRight, ArrowRight, ArrowUpRight, AtSign, Binary, Blend, Bot, Braces, CalendarClock,
  CaseSensitive, ChevronRight, CircleAlert, CircleCheck, Clock3, Code, Code2, CodeXml, Command, Contrast,
  Copy, Dices, Download, FileCode, FileCode2, FileJson2, FileQuestion, FileText, Fingerprint, FlaskConical,
  Frame, Gauge, Gift, GitCompareArrows, Globe2, Grid2X2, Hash, Heart, Image, Info, Key, KeyRound,
  LayoutPanelTop, Link: LinkIcon, Link2, ListFilter, LoaderCircle, Menu, Minimize2, Paintbrush, Palette, PanelsTopLeft,
  Percent, Pipette, QrCode, RadioTower, Regex, Replace, RotateCcw, Rows3, Ruler, Scan, Search, SearchX,
  Shapes, ShieldCheck, Shuffle, Smartphone, SquareDashed, Tags, Text, TextCursorInput, TextQuote, Trash2,
  TriangleAlert, Type, WandSparkles, Wrench, X, Zap,
}

export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const Component = icons[name] ?? Wrench
  return <Component size={size} strokeWidth={1.8} className={className} aria-hidden="true" />
}

export function Brand() {
  return <Link to="/" className="brand" aria-label="DARK DEVTOOLS home">
    <picture className="brand-picture">
      <source media="(max-width: 390px)" srcSet="/brand-emblem.webp" type="image/webp" />
      <img className="brand-logo" src="/logo-wordmark.webp" width="1420" height="443" alt="" decoding="async" />
    </picture>
  </Link>
}

export function FavoriteButton({ active, onClick, label = 'Favorite tool' }: { active: boolean; onClick: (event: React.MouseEvent) => void; label?: string }) {
  return <button className={`favorite-button${active ? ' is-favorite' : ''}`} type="button" aria-label={active ? 'Remove from favorites' : label} aria-pressed={active} onClick={onClick}>
    <Icon name={active ? 'Heart' : 'Heart'} size={16} />
  </button>
}

export function ToolCard({ tool, favorite, onToggle }: { tool: Tool; favorite: boolean; onToggle: (id: string) => void }) {
  const category = categories.find((item) => item.id === tool.category)
  return <article className="tool-card">
    <Link to={`/tools/${tool.slug}`} className="tool-card-link" aria-label={`${tool.name}. ${tool.description}`}>
      <div className="tool-card-top"><span className="tool-icon"><Icon name={tool.icon} /></span></div>
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
      <div className="tool-card-bottom"><span className="category-badge">{category?.label}</span><Icon name="ArrowUpRight" size={14} /></div>
    </Link>
    <FavoriteButton active={favorite} onClick={() => onToggle(tool.id)} />
  </article>
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>
}

export function EmptyState({ icon = 'SearchX', title, message, action }: { icon?: string; title: string; message: string; action?: React.ReactNode }) {
  return <div className="empty-state"><Icon name={icon} size={28} /><h2>{title}</h2><p>{message}</p>{action}</div>
}
