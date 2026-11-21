import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { categories } from '../data/categories'
import { getTool, tools } from '../data/tools'
import { runTool, toolExamples, type ToolOptions } from '../tools/engine'
import { PageMeta } from './Pages'
import { useToast } from '../hooks/useToast'
import { FavoriteButton, Icon, SectionHeading, ToolCard } from '../components/ui'

type FieldConfig = { key: string; label: string; kind: 'select' | 'text' | 'textarea' | 'number' | 'check' | 'color'; value?: string | number | boolean; choices?: [string, string][]; min?: number; max?: number; placeholder?: string; wide?: boolean }
const select = (key: string, label: string, choices: [string, string][], value?: string): FieldConfig => ({ key, label, kind: 'select', choices, value })
const text = (key: string, label: string, value = '', placeholder = ''): FieldConfig => ({ key, label, kind: 'text', value, placeholder, wide: true })
const textarea = (key: string, label: string, value = '', placeholder = ''): FieldConfig => ({ key, label, kind: 'textarea', value, placeholder, wide: true })
const number = (key: string, label: string, value: number, min = 0, max = 1000): FieldConfig => ({ key, label, kind: 'number', value, min, max })
const check = (key: string, label: string, value = true): FieldConfig => ({ key, label, kind: 'check', value })
const color = (key: string, label: string, value: string): FieldConfig => ({ key, label, kind: 'color', value })
const unitsByCategory: Record<string, [string, string][]> = {
  length: [['m', 'Meter (m)'], ['km', 'Kilometer (km)'], ['cm', 'Centimeter (cm)'], ['mm', 'Millimeter (mm)'], ['mi', 'Mile (mi)'], ['ft', 'Foot (ft)'], ['in', 'Inch (in)']],
  mass: [['kg', 'Kilogram (kg)'], ['g', 'Gram (g)'], ['mg', 'Milligram (mg)'], ['lb', 'Pound (lb)'], ['oz', 'Ounce (oz)']],
  temperature: [['C', 'Celsius (°C)'], ['F', 'Fahrenheit (°F)'], ['K', 'Kelvin (K)']],
  volume: [['L', 'Liter (L)'], ['mL', 'Milliliter (mL)'], ['m³', 'Cubic meter (m³)'], ['gal', 'US gallon (gal)']],
  speed: [['m/s', 'Meters / second'], ['km/h', 'Kilometers / hour'], ['mph', 'Miles / hour']],
  area: [['m²', 'Square meter'], ['km²', 'Square kilometer'], ['ft²', 'Square foot'], ['acre', 'Acre']],
  time: [['s', 'Second'], ['min', 'Minute'], ['h', 'Hour'], ['day', 'Day']],
  data: [['B', 'Byte (B)'], ['KB', 'Kilobyte (KB)'], ['MB', 'Megabyte (MB)'], ['GB', 'Gigabyte (GB)'], ['KiB', 'Kibibyte (KiB)'], ['MiB', 'Mebibyte (MiB)'], ['GiB', 'Gibibyte (GiB)']],
}

const modeChoices: Record<string, [string, string][]> = {
  'json-formatter': [['format', 'Format'], ['minify', 'Minify']],
  'json-csv': [['json-csv', 'JSON → CSV'], ['csv-json', 'CSV → JSON']],
  'json-yaml': [['json-yaml', 'JSON → YAML'], ['yaml-json', 'YAML → JSON']],
  base64: [['encode', 'Encode'], ['decode', 'Decode']],
  'url-encoder': [['encode-component', 'Encode component'], ['decode', 'Decode component'], ['encode-uri', 'Encode URI'], ['decode-uri', 'Decode URI']],
  'timestamp-converter': [['timestamp-date', 'Timestamp → date'], ['date-timestamp', 'Date → timestamp']],
  'text-diff': [['lines', 'Compare lines'], ['words', 'Compare words'], ['characters', 'Compare characters']],
  'case-converter': [['title', 'Title Case'], ['upper', 'UPPERCASE'], ['lower', 'lowercase'], ['sentence', 'Sentence case'], ['camel', 'camelCase'], ['pascal', 'PascalCase'], ['snake', 'snake_case'], ['kebab', 'kebab-case'], ['constant', 'CONSTANT_CASE']],
  'lorem-ipsum': [['paragraphs', 'Paragraphs'], ['sentences', 'Sentences'], ['words', 'Words']],
  'duplicate-lines': [['a-z', 'A to Z'], ['z-a', 'Z to A'], ['length', 'By length'], ['numeric', 'Numeric'], ['reverse', 'Reverse'], ['shuffle', 'Shuffle']],
  'html-formatter': [['format', 'Format'], ['minify', 'Minify']],
  'xml-formatter': [['format', 'Format'], ['minify', 'Minify']],
  'html-entities': [['encode', 'Encode'], ['decode', 'Decode']],
  'robots-txt': [['allow-all', 'Allow all'], ['block-all', 'Block all'], ['custom', 'Custom disallow'], ['block-ai', 'Block selected AI bots']],
  'random-dice': [['dice', 'Dice'], ['number', 'Random numbers'], ['coin', 'Coin flip']],
  'random-picker': [['pick', 'Pick winners'], ['teams', 'Split into teams']],
  'percentage-calculator': [['of', 'What is X% of Y?'], ['what-percent', 'X is what % of Y?'], ['change', 'Percentage change'], ['increase', 'Increase by X%'], ['decrease', 'Decrease by X%'], ['reverse', 'Reverse a percentage change']],
  'flexbox-playground': [['row', 'Row'], ['column', 'Column']],
  'fps-frame-time': [['fps', 'FPS to frame time'], ['improvement', 'Compare FPS improvement']],
}

function getFields(slug: string, categoryArg = 'length'): FieldConfig[] {
  const modes = modeChoices[slug] ? [select('mode', 'Mode', modeChoices[slug], modeChoices[slug][0][0])] : []
  switch (slug) {
    case 'json-formatter': return [...modes, select('indent', 'Indent', [['2', '2 spaces'], ['4', '4 spaces'], ['tab', 'Tab']], '2'), check('sort', 'Sort object keys', false)]
    case 'json-csv': return [...modes, select('delimiter', 'Delimiter', [['comma', 'Comma'], ['semicolon', 'Semicolon'], ['tab', 'Tab']], 'comma')]
    case 'base64': return [...modes, check('urlSafe', 'URL-safe Base64', false)]
    case 'timestamp-converter': return modes
    case 'regex-tester': return [text('pattern', 'Regular expression', '', 'e.g. \\d+'), text('flags', 'Flags', 'g', 'g, i, m, s, u'), text('replacement', 'Replace with', '[$&]')]
    case 'text-diff': return [...modes, textarea('compare', 'Compare against', '', 'Paste the first version here')]
    case 'case-converter': return modes
    case 'lorem-ipsum': return [...modes, number('amount', 'Amount', 3, 1, 100), check('html', 'Wrap paragraphs in HTML', false)]
    case 'duplicate-lines': return [...modes, check('dedupe', 'Remove duplicates', true), check('caseSensitive', 'Case sensitive', false), check('removeEmpty', 'Remove blank lines', false)]
    case 'find-replace': return [text('find', 'Find', '', 'Text or pattern'), text('replacement', 'Replace with', '', 'Replacement'), check('regex', 'Regular expression', false), check('caseSensitive', 'Case sensitive', false)]
    case 'slug-generator': return [select('separator', 'Separator', [['-', 'Hyphen -'], ['_', 'Underscore _']], '-'), number('maxLength', 'Max length', 120, 1, 500)]
    case 'html-formatter': return modes
    case 'xml-formatter': return modes
    case 'meta-tag-generator': return [text('title', 'Page title', 'DARK DEVTOOLS'), text('description', 'Description', 'Tools that make digital work easier.'), text('url', 'Canonical URL', 'https://example.com'), text('image', 'Image URL (optional)', '')]
    case 'robots-txt': return [...modes, text('sitemap', 'Sitemap URL (optional)', '', 'https://example.com/sitemap.xml')]
    case 'qr-code': return [number('size', 'Image size', 280, 128, 1024), color('foreground', 'Foreground', '#17151d'), color('background', 'Background', '#ffffff')]
    case 'color-toolkit':
    case 'color-converter': return []
    case 'gradient-generator': return [number('angle', 'Angle', 135, 0, 360)]
    case 'box-shadow': return [number('x', 'X offset', 0, -100, 100), number('y', 'Y offset', 12, -100, 100), number('blur', 'Blur', 32, 0, 200), number('spread', 'Spread', 0, -100, 100), color('color', 'Shadow color', '#000000')]
    case 'border-radius': return [number('radius', 'Corner radius', 12, 0, 500)]
    case 'flexbox-playground': return [...modes, select('justify', 'Justify', [['flex-start', 'Start'], ['center', 'Center'], ['space-between', 'Space between'], ['space-around', 'Space around'], ['flex-end', 'End']], 'space-between'), select('align', 'Align', [['stretch', 'Stretch'], ['center', 'Center'], ['flex-start', 'Start'], ['flex-end', 'End']], 'center'), number('gap', 'Gap (px)', 12, 0, 200)]
    case 'grid-generator': return [number('columns', 'Columns', 3, 1, 12), number('gap', 'Gap (px)', 16, 0, 200)]
    case 'contrast-checker': return [color('foreground', 'Text color', '#F4F4F5'), color('background', 'Background', '#09090B')]
    case 'css-unit-converter': return [number('root', 'Root font size (px)', 16, 8, 40)]
    case 'password-generator': return [number('length', 'Length', 20, 4, 128), number('count', 'Passwords', 1, 1, 20), check('upper', 'Uppercase', true), check('lower', 'Lowercase', true), check('numbers', 'Numbers', true), check('symbols', 'Symbols', false), check('ambiguous', 'Exclude ambiguous', true)]
    case 'passphrase-generator': return [number('count', 'Words', 5, 3, 10), select('separator', 'Separator', [['-', 'Hyphen'], [' ', 'Space'], ['_', 'Underscore']], '-'), check('capitalize', 'Capitalize words', false), check('number', 'Add a number', false)]
    case 'uuid-generator': return [number('count', 'Count', 5, 1, 1000), check('uppercase', 'Uppercase', false), check('noHyphens', 'Remove hyphens', false), check('braces', 'Wrap in braces', false)]
    case 'random-dice': return [...modes, number('count', 'Count', 1, 1, 20), number('sides', 'Die sides', 6, 2, 100), number('min', 'Minimum', 1, -100000, 100000), number('max', 'Maximum', 100, -100000, 100000)]
    case 'random-picker': return [...modes, number('count', 'Winner count', 1, 1, 100), number('teams', 'Number of teams', 2, 2, 100)]
    case 'hash-generator': return [select('algorithm', 'Algorithm', [['SHA-256', 'SHA-256'], ['SHA-384', 'SHA-384'], ['SHA-512', 'SHA-512'], ['SHA-1', 'SHA-1']], 'SHA-256'), check('uppercase', 'Uppercase output', false)]
    case 'username-generator': return [number('count', 'Suggestions', 10, 1, 50), select('separator', 'Separator', [['', 'None'], ['-', 'Hyphen']], ''), check('numbers', 'Add numbers', false)]
    case 'number-base': return [number('from', 'From base', 10, 2, 36), number('to', 'To base', 16, 2, 36)]
    case 'unit-converter': {
      const category = categoryArg
      const choices = unitsByCategory[category] ?? unitsByCategory.length
      return [select('category', 'Category', Object.keys(unitsByCategory).map((key) => [key, key === 'data' ? 'Data size' : key.charAt(0).toUpperCase() + key.slice(1)] as [string, string]), category), select('from', 'From unit', choices, choices[0][0]), select('to', 'To unit', choices, choices[1][0])]
    }
    case 'percentage-calculator': return modes
    case 'fps-frame-time': return modes
    case 'aspect-ratio': return [number('targetWidth', 'Scale to width (optional)', 0, 0, 100000)]
    default: return modes
  }
}

const htmlExample = { html: '<main class="card"><span class="eyebrow">LOCAL PREVIEW</span><h1>Build something useful.</h1><p>Your HTML, CSS and JavaScript run in an isolated sandbox.</p><button onclick="console.log(&quot;Button clicked&quot;)">Try the button</button></main>', css: 'body { min-height: 100vh; display: grid; place-items: center; margin: 0; background: #0b0911; color: #f4f4f5; font-family: system-ui, sans-serif; } .card { max-width: 520px; padding: 36px; border: 1px solid #35303f; border-radius: 14px; background: #15131b; } h1 { letter-spacing: -0.04em; } p { color: #a1a1aa; line-height: 1.7; } button { padding: 10px 14px; border: 0; border-radius: 7px; color: white; background: #7c4ae6; cursor: pointer; } .eyebrow { color: #b9a2fb; font-size: 11px; letter-spacing: .12em; }', js: 'console.log("Preview ready");' }

function Field({ config, value, onChange }: { config: FieldConfig; value: string | number | boolean; onChange: (value: string | number | boolean) => void }) {
  if (config.kind === 'check') return <label className="check-field"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />{config.label}</label>
  if (config.kind === 'textarea') return <label className="field grow"><span>{config.label}</span><textarea className="option-textarea" value={String(value)} placeholder={config.placeholder} onChange={(event) => onChange(event.target.value)} /></label>
  return <label className={`field${config.wide ? ' grow' : ''}`}><span>{config.label}</span>
    {config.kind === 'select'
      ? <select value={String(value)} onChange={(event) => onChange(event.target.value)}>{config.choices?.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select>
      : <input type={config.kind === 'color' ? 'color' : config.kind} value={String(value)} placeholder={config.placeholder} min={config.min} max={config.max} onChange={(event) => onChange(config.kind === 'number' ? Number(event.target.value) : event.target.value)} />}
  </label>
}

function createSrcDoc(html: string, css: string, js: string) {
  const policy = "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; font-src data:; media-src data: blob:; form-action 'none';"
  const bridge = `(() => { const send=(type,args)=>parent.postMessage({__darkDevtools:true,type,args:Array.from(args).map(x=>{try{return typeof x==='string'?x:JSON.stringify(x)}catch{return String(x)}})},'*'); const oldLog=console.log; console.log=(...args)=>{send('log',args);oldLog.apply(console,args)}; window.addEventListener('error',e=>send('error',[e.message])); })();`
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${html}<script>${bridge}</script><script>${js}</script></body></html>`
}

function jsonKeyCount(value: unknown): number {
  if (Array.isArray(value)) return value.reduce((count, item) => count + jsonKeyCount(item), 0)
  if (value && typeof value === 'object') return Object.entries(value).reduce((count, [, item]) => count + 1 + jsonKeyCount(item), 0)
  return 0
}

export default function ToolPage({ favorites, toggleFavorite }: { favorites: string[]; toggleFavorite: (id: string) => void }) {
  const { slug = '' } = useParams()
  const tool = getTool(slug)
  const { toast } = useToast()
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [options, setOptions] = useState<ToolOptions>(() => Object.fromEntries(getFields(slug).map((field) => [field.key, field.value ?? ''])))
  const fields = useMemo(() => getFields(slug, String(options.category ?? 'length')), [slug, options.category])
  const [file, setFile] = useState<File | null>(null)
  const [html, setHtml] = useState(htmlExample.html)
  const [css, setCss] = useState(htmlExample.css)
  const [js, setJs] = useState(htmlExample.js)
  const [preview, setPreview] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [consoleLines, setConsoleLines] = useState<string[]>([])
  const [activeEditor, setActiveEditor] = useState<'html' | 'css' | 'js'>('html')
  const [clockPaused, setClockPaused] = useState(false)
  const [clockNow, setClockNow] = useState(Date.now())
  const isPlayground = slug === 'html-playground'
  const isMarkdown = slug === 'markdown-preview'
  const isQr = slug === 'qr-code'
  const isImage = slug === 'image-base64'
  const category = tool && categories.find((item) => item.id === tool.category)

  useEffect(() => {
    if (!tool) return
    const next = Object.fromEntries(getFields(slug).map((field) => [field.key, field.value ?? '']))
    setOptions(next)
    setInput('')
    setResult('')
    setError('')
    setFile(null)
  }, [slug, tool])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== document.querySelector<HTMLIFrameElement>('#html-playground-frame')?.contentWindow) return
      if (!event.data || event.data.__darkDevtools !== true) return
      const line = `${event.data.type === 'error' ? 'Error' : '›'} ${(event.data.args as unknown[]).join(' ')}`
      setConsoleLines((current) => [...current.slice(-19), line])
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  useEffect(() => {
    if (slug !== 'timestamp-converter' || clockPaused) return
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [slug, clockPaused])
  useEffect(() => {
    if (!tool) return
    const timer = window.setTimeout(() => {
      const heading = document.querySelector<HTMLElement>('#main-content h1')
      heading?.setAttribute('tabindex', '-1')
      heading?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [slug, tool])

  if (!tool) return <Navigate to="/404" replace />

  const setOption = (key: string, value: string | number | boolean) => {
    if (slug === 'unit-converter' && key === 'category') {
      const nextFields = getFields(slug, String(value))
      setOptions((current) => ({ ...current, category: value, from: nextFields.find((field) => field.key === 'from')?.value ?? '', to: nextFields.find((field) => field.key === 'to')?.value ?? '' }))
      return
    }
    setOptions((current) => ({ ...current, [key]: value }))
  }
  const run = async () => {
    setError('')
    setWorking(true)
    try {
      if (isPlayground) {
        setConsoleLines([])
        setPreview(createSrcDoc(html, css, js))
        setResult('preview')
      } else if (isImage && !file) {
        throw new Error('Choose an image file first.')
      } else if (isImage && file) {
        if (!file.type.startsWith('image/')) throw new Error('Choose a valid image file.')
        if (file.size > 10 * 1024 * 1024) throw new Error('This demo accepts images up to 10 MB.')
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error('The image could not be read.'))
          reader.readAsDataURL(file)
        })
        setImagePreview(data)
        setResult(`Data URI:\n${data}\n\nRaw Base64:\n${data.split(',')[1]}\n\nCSS:\nbackground-image: url("${data}");\n\nHTML:\n<img src="${data}" alt="">`)
      } else if (slug === 'hash-generator' && file) {
        if (file.size > 20 * 1024 * 1024) throw new Error('Choose a file smaller than 20 MB for this browser-based digest.')
        const digest = await crypto.subtle.digest(String(options.algorithm || 'SHA-256'), await file.arrayBuffer())
        const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
        setResult(`${String(options.algorithm || 'SHA-256')} · ${file.name}\nHEX: ${options.uppercase ? hex.toUpperCase() : hex}\nBase64: ${btoa(String.fromCharCode(...new Uint8Array(digest)))}`)
      } else {
        setResult(await runTool(slug, input, options))
      }
    } catch (caught) {
      setResult('')
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Check your input and try again.')
    } finally {
      setWorking(false)
    }
  }
  const tryExample = () => {
    if (isPlayground) {
      setHtml(htmlExample.html); setCss(htmlExample.css); setJs(htmlExample.js); setPreview(''); setConsoleLines([]); setError('')
      return
    }
    const example = toolExamples[slug]
    if (example) setInput(example)
    if (slug === 'regex-tester') setOptions((current) => ({ ...current, pattern: '\\d+', flags: 'g', replacement: '[$&]' }))
    if (slug === 'text-diff') setOptions((current) => ({ ...current, compare: 'The quick brown fox jumps over the lazy dog.' }))
    if (slug === 'find-replace') setOptions((current) => ({ ...current, find: 'fox', replacement: 'cat' }))
    if (slug === 'meta-tag-generator') setOptions((current) => ({ ...current, title: 'DARK DEVTOOLS', description: 'A fast and private browser toolkit.', url: 'https://example.com' }))
    if (slug === 'contrast-checker') setOptions((current) => ({ ...current, foreground: '#F4F4F5', background: '#09090B' }))
    setResult('')
    setError('')
  }
  const clear = () => {
    setInput(''); setResult(''); setError(''); setFile(null); setPreview(''); setImagePreview(''); setConsoleLines([])
    setOptions(Object.fromEntries(fields.map((field) => [field.key, field.value ?? ''])))
    if (isPlayground) { setHtml(htmlExample.html); setCss(htmlExample.css); setJs(htmlExample.js) }
  }
  const copy = async (value = result) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const helper = document.createElement('textarea')
      helper.value = value
      helper.style.position = 'fixed'
      helper.style.opacity = '0'
      document.body.append(helper)
      helper.select()
      const copied = document.execCommand('copy')
      helper.remove()
      if (!copied) { setError('Copy was blocked by the browser. Select the output and copy it manually.'); return }
    }
    toast('Copied to clipboard')
  }
  const onFavorite = () => { toggleFavorite(tool.id); toast(favorites.includes(tool.id) ? 'Removed from favorites' : 'Added to favorites') }
  const outputImage = isQr && result.startsWith('data:image/')
  const markup = isMarkdown && result
  const outputText = isQr ? '' : result
  const related = tool.related.map((id) => tools.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item))

  return <main className="container tool-content" id="main-content">
    <PageMeta title={tool.name} description={tool.description} schema={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, description: tool.description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true, url: import.meta.env.SITE_URL ? `${import.meta.env.SITE_URL.replace(/\/+$/, '')}/tools/${tool.slug}` : `${window.location.origin}/tools/${tool.slug}` }} />
    <div className="breadcrumbs"><Link to="/">Home</Link><Icon name="ChevronRight" size={13} /><Link to="/tools">Tools</Link><Icon name="ChevronRight" size={13} /><span>{tool.name}</span></div>
    <header className="workspace-header">
      <div className="workspace-title-row">
        <div className="workspace-title"><span className="tool-icon"><Icon name={tool.icon} size={20} /></span><div><h1>{tool.name}</h1><p>{tool.description}</p></div></div>
        <FavoriteButton active={favorites.includes(tool.id)} onClick={(event) => { event.preventDefault(); onFavorite() }} />
      </div>
    </header>
    <div className="workspace">
      <section className="panel" aria-label="Tool input">
        <div className="panel-head"><span>{isPlayground ? 'Code editor' : isImage || slug === 'hash-generator' ? 'Input or file' : 'Input'}</span><div className="panel-head-actions"><button className="icon-action" title="Load an example" aria-label="Load an example" onClick={tryExample}><Icon name="FlaskConical" /></button><button className="icon-action" title="Clear input" aria-label="Clear input" onClick={clear}><Icon name="Trash2" /></button></div></div>
        {slug === 'timestamp-converter' && <div className="live-clock"><span>Current Unix time: <code>{Math.floor(clockNow / 1000)}</code></span><button className="icon-action" onClick={() => setInput(String(Math.floor(clockNow / 1000)))} aria-label="Use current timestamp">Use now</button><button className="icon-action" onClick={() => setClockPaused(!clockPaused)}>{clockPaused ? 'Resume clock' : 'Pause clock'}</button></div>}
        {isPlayground ? <div>
          <div className="filter-row" style={{ padding: '9px 12px 0' }}>{(['html', 'css', 'js'] as const).map((tab) => <button key={tab} className={`chip${activeEditor === tab ? ' active' : ''}`} onClick={() => setActiveEditor(tab)}>{tab.toUpperCase()}</button>)}</div>
          <textarea className="editor" aria-label={`${activeEditor.toUpperCase()} editor`} spellCheck={false} value={activeEditor === 'html' ? html : activeEditor === 'css' ? css : js} onChange={(event) => activeEditor === 'html' ? setHtml(event.target.value) : activeEditor === 'css' ? setCss(event.target.value) : setJs(event.target.value)} placeholder={`Enter ${activeEditor.toUpperCase()} here...`} />
        </div> : isImage || slug === 'hash-generator' ? <>
          {isImage && <div className="option-panel"><label className="field grow"><span>Choose an image (processed on this device)</span><input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label></div>}
          {slug === 'hash-generator' && <div className="option-panel"><label className="field grow"><span>Optional file (read locally; max 20 MB)</span><input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label></div>}
          <textarea className="editor" value={input} onChange={(event) => setInput(event.target.value)} placeholder={isImage ? 'Choose a file above, then convert it to a data URI.' : 'Enter text to hash, or choose a file above.'} spellCheck={false} aria-label="Input text" />
        </> : slug === 'contrast-checker' ? <div className="output-content" style={{ minHeight: 310 }}><p style={{ color: 'var(--muted)', marginTop: 0 }}>Choose foreground and background colors, then check their contrast ratio.</p><div style={{ padding: 28, borderRadius: 8, color: String(options.foreground), background: String(options.background), border: '1px solid var(--border)' }}>Sample text — Aa 123<br /><small>Accessible color combinations improve readability.</small></div><p className="option-note">This checks color contrast only; it does not assess font weight, size or other accessibility needs.</p></div> : slug === 'qr-code' ? <textarea className="editor" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Enter text or a URL to create a QR code..." spellCheck={false} aria-label="Text or URL for QR code" /> : slug === 'meta-tag-generator' ? <textarea className="editor" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Optional page description..." spellCheck={false} aria-label="Optional page description" /> : slug === 'robots-txt' ? <textarea className="editor" value={input} onChange={(event) => setInput(event.target.value)} placeholder="/private/" spellCheck={false} aria-label="Disallow path" /> : <textarea className="editor" value={input} onChange={(event) => setInput(event.target.value)} placeholder={slug === 'text-diff' ? 'Paste the updated text here...' : slug === 'percentage-calculator' ? 'For example: 15, 240' : slug === 'aspect-ratio' ? 'For example: 1920 × 1080' : slug === 'css-unit-converter' ? 'For example: 24' : 'Paste or type your input here...'} spellCheck={false} aria-label="Tool input" />}
        {fields.length > 0 && <div className="option-panel">{fields.map((config) => <Field key={config.key} config={config} value={options[config.key] ?? config.value ?? ''} onChange={(value) => setOption(config.key, value)} />)}</div>}
      </section>
      <section className="panel" aria-label="Tool output">
        <div className="panel-head"><span>{isPlayground ? 'Live preview' : isQr ? 'QR preview' : isMarkdown ? 'Markdown preview' : 'Output'}</span><div className="panel-head-actions">
          {result && <><button className="icon-action" title="Copy output" aria-label="Copy output" onClick={() => copy()}><Icon name="Copy" /></button><button className="icon-action" title="Download output" aria-label="Download output" onClick={() => {
            const blob = new Blob([result], { type: isQr ? 'image/png' : 'text/plain;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const anchor = document.createElement('a'); anchor.href = outputImage ? result : url; anchor.download = `${slug}.${outputImage ? 'png' : 'txt'}`; anchor.click()
            if (!outputImage) URL.revokeObjectURL(url)
          }}><Icon name="Download" /></button></>}
        </div></div>
        {isPlayground ? <div>
          {preview ? <iframe id="html-playground-frame" className="html-preview" title="HTML playground preview" sandbox="allow-scripts" srcDoc={preview} /> : <div className="output-empty"><Icon name="PanelsTopLeft" /><strong>Your preview will appear here</strong><span>Run the code to render the isolated preview.</span></div>}
          <div className="option-panel" style={{ display: 'block' }}><div className="panel-head" style={{ padding: '0 0 8px', border: 0 }}>Console <button className="icon-action" aria-label="Clear console" onClick={() => setConsoleLines([])}><Icon name="Trash2" /></button></div><pre style={{ minHeight: 36, margin: 0, color: 'var(--muted)', font: '11px/1.6 var(--font-code)' }}>{consoleLines.length ? consoleLines.join('\n') : 'Console output appears here when your preview logs a message.'}</pre></div>
        </div> : outputImage ? <div className="output-content" style={{ display: 'grid', placeItems: 'center' }}><img className="qr-preview" src={result} alt={`Generated QR code for ${input.slice(0, 80)}`} /><button className="button" onClick={() => copy(input)}>Copy encoded content</button></div>
          : isImage && result ? <div className="output-content"><img className="qr-preview" src={imagePreview} alt={file?.name ? `Preview of ${file.name}` : 'Image preview'} /><pre>{outputText}</pre></div>
          : markup ? <div className="output-content markdown-preview" dangerouslySetInnerHTML={{ __html: result }} />
            : result ? <pre className="output-content" aria-label="Tool output">{outputText}</pre>
              : <div className="output-empty"><Icon name={isQr ? 'QrCode' : 'Braces'} /><strong>Output will show here</strong><span>Run the tool to see your result. Nothing is saved.</span></div>}
      </section>
    </div>
    {slug === 'html-playground' && <div className="privacy-callout"><Icon name="ShieldCheck" /><span>The preview runs in a sandboxed frame with no same-origin access and network requests disabled. It cannot read this page’s storage.</span></div>}
    {(isImage || slug === 'hash-generator' || slug === 'password-generator' || slug === 'passphrase-generator') && <div className="privacy-callout"><Icon name="ShieldCheck" /><span>Your {isImage ? 'image' : slug === 'hash-generator' ? 'text or file' : 'generated value'} is processed in this browser and is not uploaded or stored by this tool.</span></div>}
    <div className="workspace-actions">
      <button className="button button-primary" onClick={run} disabled={working}><Icon name={working ? 'LoaderCircle' : isPlayground ? 'Play' : 'WandSparkles'} />{working ? 'Working…' : isPlayground ? 'Run preview' : 'Run tool'}</button>
      <button className="button" onClick={tryExample}><Icon name="FlaskConical" />Try an example</button>
      <button className="button button-ghost" onClick={clear}><Icon name="RotateCcw" />Clear / reset</button>
      {result && !isQr && <button className="button button-ghost" onClick={() => copy()}><Icon name="Copy" />Copy output</button>}
    </div>
    {error && <p className="status-line error" role="alert"><Icon name="CircleAlert" />{error}</p>}
    {result && !error && <p className="status-line"><Icon name="CircleCheck" />{slug === 'json-formatter' ? `Valid JSON · ${new Blob([result]).size.toLocaleString()} bytes · ${jsonKeyCount(JSON.parse(result))} keys.` : 'Ready. Review the result before using it.'}</p>}
    {slug === 'js-minifier' && <div className="privacy-callout"><Icon name="Info" /><span>Basic whitespace and comment compaction only. This does not rename variables or replace a production build tool.</span></div>}
    {slug === 'jwt-decoder' && <div className="privacy-callout"><Icon name="TriangleAlert" /><span>JWT decoding only. The token signature is not verified, and decoded claims should not be trusted without verification.</span></div>}
    {slug === 'robots-txt' && <div className="privacy-callout"><Icon name="Info" /><span>robots.txt is a crawler preference, not a security or access-control mechanism.</span></div>}
    <section className="info-grid">
      <div className="info-box"><h2>How to use</h2><ol>{tool.howTo.map((step, index) => <li key={index}>{step}</li>)}</ol></div>
      <div className="info-box"><h2>About this tool</h2><p>{tool.longDescription}</p>{category && <Link className="text-link" to={`/category/${category.id}`}>Explore {category.label} tools <Icon name="ArrowRight" size={14} /></Link>}</div>
    </section>
    {!!related.length && <section className="section"><SectionHeading title="Related tools" description="Keep your workflow moving." /><div className="card-grid">{related.map((item) => <ToolCard key={item.id} tool={item} favorite={favorites.includes(item.id)} onToggle={toggleFavorite} />)}</div></section>}
  </main>
}
