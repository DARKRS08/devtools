export type ToolOptions = Record<string, string | number | boolean>

const bytes = (value: string) => new TextEncoder().encode(value)
const sizeLabel = (value: string) => `${new Blob([value]).size.toLocaleString()} bytes`
const escHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
const numberOption = (options: ToolOptions, key: string, fallback: number) => {
  const value = Number(options[key])
  return Number.isFinite(value) ? value : fallback
}

function secureInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1) throw new Error('Choose a valid positive range.')
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive
  const sample = new Uint32Array(1)
  do crypto.getRandomValues(sample)
  while (sample[0] >= limit)
  return sample[0] % maxExclusive
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureInt(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

type RegexResult = { matches?: { text: string; index: number; captures?: string[]; groups?: Record<string, string> }[]; output?: string }

function runRegexWorker(request: { kind: 'test' | 'replace'; input: string; pattern: string; flags: string; replacement?: string }) {
  if (typeof Worker === 'undefined') return Promise.reject(new Error('This browser does not support the isolated regex worker.'))
  return new Promise<RegexResult>((resolve, reject) => {
    const worker = new Worker(new URL('../workers/regex.worker.ts', import.meta.url), { type: 'module' })
    const timeout = window.setTimeout(() => {
      worker.terminate()
      reject(new Error('This pattern took too long and was stopped. Try simplifying the regular expression.'))
    }, 1000)
    worker.onmessage = (event: MessageEvent<RegexResult & { error?: string }>) => {
      window.clearTimeout(timeout)
      worker.terminate()
      if (event.data.error) reject(new Error(event.data.error))
      else resolve(event.data)
    }
    worker.onerror = () => {
      window.clearTimeout(timeout)
      worker.terminate()
      reject(new Error('The regular expression worker failed.'))
    }
    worker.postMessage(request)
  })
}

function minifyJsComments(input: string): string {
  let output = ''
  let quote = ''
  let escaped = false
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    const next = input[i + 1]
    if (quote) {
      output += char
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; output += char; continue }
    if (char === '/' && next === '/') {
      i += 2
      while (i < input.length && input[i] !== '\n' && input[i] !== '\r') i++
      output += ' '
      continue
    }
    if (char === '/' && next === '*') {
      const end = input.indexOf('*/', i + 2)
      if (end < 0) throw new Error('A block comment was not closed.')
      i = end + 1
      output += ' '
      continue
    }
    output += /\s/.test(char) ? ' ' : char
  }
  return output.trim().replace(/ {2,}/g, ' ')
}

function cronValues(field: string, min: number, max: number, sunday = false) {
  const values = new Set<number>()
  for (const part of field.split(',')) {
    if (!part) throw new Error('Cron lists cannot contain an empty value.')
    const [rangePart, stepPart] = part.split('/')
    const step = stepPart === undefined ? 1 : Number(stepPart)
    if (!Number.isInteger(step) || step < 1) throw new Error(`Invalid cron step in “${part}”.`)
    let start: number
    let end: number
    if (rangePart === '*') { start = min; end = max }
    else if (/^\d+-\d+$/.test(rangePart)) [start, end] = rangePart.split('-').map(Number)
    else if (/^\d+$/.test(rangePart)) {
      start = Number(rangePart)
      end = stepPart === undefined ? start : max
    } else throw new Error(`Unsupported cron field value “${part}”.`)
    if (start < min || end > max || start > end) throw new Error(`Cron value “${part}” is outside the range ${min}–${max}.`)
    for (let value = start; value <= end; value += step) values.add(sunday && value === 7 ? 0 : value)
  }
  return values
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, sortKeys(item)]))
  }
  return value
}

function jsonToCsv(text: string, delimiter: string): string {
  const data = JSON.parse(text) as unknown
  if (!Array.isArray(data) || data.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) {
    throw new Error('Enter a JSON array of objects to convert to CSV.')
  }
  const rows = data as Record<string, unknown>[]
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const quote = (value: unknown) => {
    const raw = typeof value === 'string' ? value : JSON.stringify(value ?? '')
    return /["\r\n]/.test(raw) || raw.includes(delimiter) ? `"${raw.replace(/"/g, '""')}"` : raw
  }
  return [headers.map(quote).join(delimiter), ...rows.map((row) => headers.map((key) => quote(row[key] ?? '')).join(delimiter))].join('\n')
}

function csvToJson(text: string, delimiter: string): string {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted && char === '"' && text[i + 1] === '"') { cell += '"'; i++ }
    else if (char === '"') quoted = !quoted
    else if (!quoted && char === delimiter) { row.push(cell); cell = '' }
    else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += char
  }
  if (quoted) throw new Error('A quoted CSV value was not closed.')
  if (cell || row.length) { row.push(cell); rows.push(row) }
  if (rows.length < 2) throw new Error('Add a header row and at least one data row.')
  const [headers, ...records] = rows
  if (records.some((record) => record.length !== headers.length)) throw new Error('Every row must have the same number of columns.')
  return JSON.stringify(records.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index]]))), null, 2)
}

const base64Encode = (input: string) => btoa(Array.from(bytes(input), (byte) => String.fromCharCode(byte)).join(''))
const base64Decode = (input: string) => new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(input.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0)))

function textWords(text: string) {
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null
  return segmenter ? [...segmenter.segment(text)].filter((item) => item.isWordLike).map((item) => item.segment) : (text.match(/[\p{L}\p{N}]+/gu) ?? [])
}

function slugify(text: string, separator: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, separator).replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '')
}

function parseHex(hex: string): [number, number, number] {
  const value = hex.trim().replace(/^#/, '')
  if (/^[\da-f]{3,4}$/i.test(value)) {
    const channels = value.slice(0, 3).split('').map((channel) => Number.parseInt(channel + channel, 16))
    return channels as [number, number, number]
  }
  if (/^[\da-f]{6}([\da-f]{2})?$/i.test(value)) return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16)) as [number, number, number]
  throw new Error('Enter a valid 3-, 4-, 6- or 8-digit HEX color.')
}

function rgbHex(input: string) {
  const value = input.trim().toLowerCase()
  const named: Record<string, string> = { black: '#000000', white: '#FFFFFF', red: '#FF0000', green: '#008000', blue: '#0000FF', yellow: '#FFFF00', purple: '#800080', orange: '#FFA500', pink: '#FFC0CB', transparent: '#000000' }
  const colorValue = named[value] ?? value
  const rgbMatch = colorValue.match(/rgba?\(\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?/i)
  let rgb: number[]
  if (rgbMatch) {
    const percentages = /rgba?\(\s*[\d.]+%\s*,\s*[\d.]+%\s*,\s*[\d.]+%/i.test(colorValue)
    rgb = rgbMatch.slice(1, 4).map((part) => Number(part) * (percentages ? 2.55 : 1))
  } else {
    const hslMatch = colorValue.match(/hsla?\(\s*([\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i)
    if (hslMatch) {
      const h = ((Number(hslMatch[1]) % 360) + 360) % 360
      const s = Math.min(100, Number(hslMatch[2])) / 100
      const l = Math.min(100, Number(hslMatch[3])) / 100
      const chroma = (1 - Math.abs(2 * l - 1)) * s
      const x = chroma * (1 - Math.abs((h / 60) % 2 - 1))
      const [r, g, b] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x]
      const m = l - chroma / 2
      rgb = [r, g, b].map((channel) => (channel + m) * 255)
    } else rgb = parseHex(colorValue)
  }
  return `#${rgb.map((part) => Math.round(Math.max(0, Math.min(255, part))).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function luminance(hex: string) {
  return parseHex(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0)
}

const httpCodes: Record<string, string> = {
  '100': 'Continue', '101': 'Switching Protocols', '200': 'OK', '201': 'Created', '202': 'Accepted', '204': 'No Content',
  '301': 'Moved Permanently', '302': 'Found', '304': 'Not Modified', '400': 'Bad Request', '401': 'Unauthorized',
  '403': 'Forbidden', '404': 'Not Found', '405': 'Method Not Allowed', '408': 'Request Timeout', '409': 'Conflict',
  '410': 'Gone', '415': 'Unsupported Media Type', '418': "I'm a teapot", '422': 'Unprocessable Content', '429': 'Too Many Requests',
  '500': 'Internal Server Error', '501': 'Not Implemented', '502': 'Bad Gateway', '503': 'Service Unavailable', '504': 'Gateway Timeout',
}

const simpleWords = 'amber apple atlas aurora badger basil beacon birch blossom blue boulder breeze bronze brook cactus canyon cedar cherry cipher cloud cobalt comet coral cosmos crimson crystal dawn delta denim desert drift dusk echo ember fern field finch flame forest fossil frost galaxy garden garnet gentle glade glimmer granite harbor hazel heather horizon indigo island ivory jade juniper kestrel lagoon lantern larch lavender lemon lilac linen lotus maple marble meadow melon mercury midnight mint mist monarch moss mountain muse nebula nectar nightingale noble nova ocean olive onyx opal orbit orchid otter owl paper pebble pepper phoenix pine planet plum polar pollen prairie prism quartz quest quiet rabbit rainbow raven reed river robin robinwood rose ruby sage sailor scarlet sequoia shadow shale silver sky slate solar sparrow spring spruce star stone storm summit sunny teal thistle thunder tiger timber topaz tulip velvet violet walnut wander willow wind winter wolf wren yellow zephyr'.split(' ')
const adjectives = 'bright calm clever cosmic daring electric fearless gentle happy hidden keen lively lucky mighty nimble playful quick radiant silent stellar swift vivid wild'.split(' ')
const nouns = 'badger birch comet fox galaxy harbor lantern maple otter phoenix river sparrow tiger willow wolf'.split(' ')

export async function runTool(slug: string, input: string, options: ToolOptions = {}): Promise<string> {
  const mode = String(options.mode ?? '')
  const delimiter = options.delimiter === 'tab' ? '\t' : options.delimiter === 'semicolon' ? ';' : ','
  switch (slug) {
    case 'json-formatter': {
      const parsed = JSON.parse(input) as unknown
      const value = options.sort ? sortKeys(parsed) : parsed
      return mode === 'minify' ? JSON.stringify(value) : JSON.stringify(value, null, options.indent === 'tab' ? '\t' : Number(options.indent || 2))
    }
    case 'json-csv': return mode === 'csv-json' ? csvToJson(input, delimiter) : jsonToCsv(input, delimiter)
    case 'json-yaml': {
      const yaml = await import('js-yaml')
      return mode === 'yaml-json' ? JSON.stringify(yaml.load(input), null, 2) : yaml.dump(JSON.parse(input), { noRefs: true, lineWidth: -1 })
    }
    case 'base64': {
      return mode === 'decode' ? base64Decode(input + '='.repeat((4 - input.length % 4) % 4)) : base64Encode(input).replace(/\+/g, options.urlSafe ? '-' : '+').replace(/\//g, options.urlSafe ? '_' : '/').replace(options.urlSafe ? /=+$/ : /$^/, '')
    }
    case 'url-encoder':
      if (mode === 'decode') return decodeURIComponent(input)
      if (mode === 'encode-uri') return encodeURI(input)
      if (mode === 'decode-uri') return decodeURI(input)
      return encodeURIComponent(input)
    case 'timestamp-converter': {
      const value = mode === 'date-timestamp' ? new Date(input).getTime() : Number(input)
      if (!Number.isFinite(value)) throw new Error('Enter a valid timestamp or date.')
      const date = new Date(mode === 'date-timestamp' ? value : Math.abs(value) < 1e12 ? value * 1000 : value)
      if (Number.isNaN(date.getTime())) throw new Error('This timestamp is outside the supported date range.')
      return mode === 'date-timestamp' ? `${Math.floor(value / 1000)} seconds\n${value} milliseconds` :
        `ISO 8601: ${date.toISOString()}\nLocal: ${date.toLocaleString()}\nUTC: ${date.toUTCString()}\nRelative: ${new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round((date.getTime() - Date.now()) / 86400000), 'day')}`
    }
    case 'regex-tester': {
      const pattern = String(options.pattern ?? '')
      if (!pattern) throw new Error('Enter a regular expression pattern.')
      const flags = String(options.flags ?? 'g')
      const matches = await runRegexWorker({ kind: 'test', input, pattern, flags })
      const replacement = await runRegexWorker({ kind: 'replace', input, pattern, flags, replacement: String(options.replacement ?? '') })
      const rows = matches.matches ?? []
      return `${rows.length} match${rows.length === 1 ? '' : 'es'}\n\n${rows.map((match, index) => `${index + 1}. "${match.text}" at ${match.index}${match.groups ? `\n   groups: ${JSON.stringify(match.groups)}` : match.captures?.length ? `\n   captures: ${JSON.stringify(match.captures)}` : ''}`).join('\n') || 'No matches found.'}\n\nReplace preview:\n${replacement.output ?? input}`
    }
    case 'text-diff': {
      const other = String(options.compare ?? '')
      const diff = await import('diff')
      const changes = mode === 'words' ? diff.diffWords(other, input) : mode === 'characters' ? diff.diffChars(other, input) : diff.diffLines(other, input)
      return changes.map((part) => `${part.added ? '+' : part.removed ? '-' : ' '} ${part.value}`).join('')
    }
    case 'jwt-decoder': {
      const parts = input.trim().split('.')
      if (parts.length < 2) throw new Error('A JWT should contain a header and payload separated by dots.')
      const decode = (part: string) => JSON.parse(base64Decode(part.replace(/-/g, '+').replace(/_/g, '/')))
      const header = decode(parts[0]) as Record<string, unknown>
      const payload = decode(parts[1]) as Record<string, unknown>
      const dates = ['exp', 'iat', 'nbf'].filter((key) => typeof payload[key] === 'number').map((key) => `${key}: ${new Date(Number(payload[key]) * 1000).toLocaleString()}`)
      return `⚠ Decoding only — signature NOT verified.\n\nHeader:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}${dates.length ? `\n\nToken dates:\n${dates.join('\n')}` : ''}`
    }
    case 'http-status': {
      const query = input.trim()
      const rows = Object.entries(httpCodes).filter(([code, name]) => !query || code.includes(query) || name.toLowerCase().includes(query.toLowerCase()))
      return rows.map(([code, name]) => `${code}  ${name}`).join('\n') || 'No matching status codes in this quick reference.'
    }
    case 'cron-explainer': {
      const fields = input.trim().split(/\s+/)
      if (fields.length !== 5) throw new Error('Use a five-field cron expression: minute hour day-of-month month day-of-week.')
      const limits: [number, number][] = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]]
      const sets = fields.map((field, index) => cronValues(field, ...limits[index], index === 4))
      const labels = ['minute', 'hour', 'day of month', 'month', 'day of week']
      const explanation = fields.map((field, i) => `${labels[i]}: ${field === '*' ? `every ${labels[i]}` : field}`).join('\n')
      const runs: string[] = []
      const date = new Date()
      date.setSeconds(0, 0)
      date.setMinutes(date.getMinutes() + 1)
      for (let checked = 0; checked < 527040 && runs.length < 5; checked++, date.setMinutes(date.getMinutes() + 1)) {
        const minute = date.getMinutes(), hour = date.getHours(), day = date.getDate(), month = date.getMonth() + 1, weekday = date.getDay()
        const domWildcard = fields[2] === '*', dowWildcard = fields[4] === '*'
        const dayMatches = domWildcard && dowWildcard ? true : domWildcard ? sets[4].has(weekday) : dowWildcard ? sets[2].has(day) : sets[2].has(day) || sets[4].has(weekday)
        if (sets[0].has(minute) && sets[1].has(hour) && sets[3].has(month) && dayMatches) runs.push(date.toLocaleString())
      }
      return `${explanation}\n\nNext 5 runs (local time):\n${runs.map((run, index) => `${index + 1}. ${run}`).join('\n') || 'No run found in the next year.'}\n\nSupported syntax: *, number, range (1-5), list (1,3,5), and step (*/10, 2-20/3). Uses standard 5-field minute/hour/day/month/weekday order.`
    }
    case 'word-counter': {
      const words = textWords(input)
      const counts = new Map<string, number>()
      for (const word of words) if (word.length > 2) counts.set(word.toLowerCase(), (counts.get(word.toLowerCase()) ?? 0) + 1)
      const repeated = [...counts].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]).slice(0, 5)
      const sentences = input.split(/[.!?]+/).filter((part) => part.trim()).length
      return `Words: ${words.length}\nCharacters: ${[...input].length}\nCharacters without spaces: ${[...input].filter((char) => !/\s/.test(char)).length}\nLines: ${input ? input.split(/\r\n|\r|\n/).length : 0}\nParagraphs: ${input.trim() ? input.trim().split(/\n\s*\n/).length : 0}\nSentences: ${sentences}\nReading time: ${Math.ceil(words.length / 200)} min\nSpeaking time: ${Math.ceil(words.length / 130)} min\nTop repeated words: ${repeated.map(([word, count]) => `${word} (${count})`).join(', ') || 'none'}`
    }
    case 'case-converter': {
      const words = input.match(/[\p{L}\p{N}]+/gu) ?? []
      const title = words.map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase()).join(' ')
      const camel = words.map((word, i) => i ? word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase() : word.toLocaleLowerCase()).join('')
      const cases: Record<string, string> = {
        upper: input.toLocaleUpperCase(), lower: input.toLocaleLowerCase(), title,
        sentence: input ? input.charAt(0).toLocaleUpperCase() + input.slice(1).toLocaleLowerCase() : '',
        camel, pascal: camel ? camel.charAt(0).toLocaleUpperCase() + camel.slice(1) : '',
        snake: words.map((word) => word.toLocaleLowerCase()).join('_'),
        kebab: words.map((word) => word.toLocaleLowerCase()).join('-'),
        constant: words.map((word) => word.toLocaleUpperCase()).join('_'),
      }
      return cases[mode || 'title'] ?? Object.entries(cases).map(([key, value]) => `${key}: ${value}`).join('\n')
    }
    case 'lorem-ipsum': {
      const amount = Math.min(100, Math.max(1, Number(options.amount) || 3))
      const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer commodo, sapien a posuere fermentum, justo augue tincidunt purus, sit amet malesuada nunc lorem at odio. Vivamus vitae ex sed urna feugiat pretium.'
      if (mode === 'words') return (('Lorem ipsum dolor sit amet consectetur adipiscing elit ' + text).repeat(Math.ceil(amount / 16))).trim().split(/\s+/).slice(0, amount).join(' ') + '.'
      if (mode === 'sentences') return Array.from({ length: amount }, (_, i) => text.split('. ')[i % 3] + '.').join(' ')
      const paragraphs = Array.from({ length: Math.min(amount, 20) }, () => text).join('\n\n')
      return options.html ? paragraphs.split('\n\n').map((paragraph) => `<p>${paragraph}</p>`).join('\n') : paragraphs
    }
    case 'duplicate-lines': {
      let lines = input.split(/\r\n|\r|\n/)
      const originalLength = lines.length
      if (options.removeEmpty) lines = lines.filter((line) => line.trim())
      if (options.dedupe !== false) {
        const seen = new Set<string>()
        lines = lines.filter((line) => {
          const key = options.caseSensitive ? line : line.toLocaleLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
      }
      if (mode === 'reverse') lines.reverse()
      else if (mode === 'length') lines.sort((a, b) => a.length - b.length)
      else if (mode === 'numeric') lines.sort((a, b) => Number(a) - Number(b))
      else if (mode === 'shuffle') lines = shuffle(lines)
      else if (mode === 'z-a') lines.sort((a, b) => b.localeCompare(a))
      else if (mode === 'a-z') lines.sort((a, b) => a.localeCompare(b))
      return `${lines.join('\n')}\n\nRemoved ${originalLength - lines.length} line(s).`
    }
    case 'find-replace': {
      const needle = String(options.find ?? '')
      if (!needle) throw new Error('Enter the text or pattern to find.')
      const pattern = options.regex ? needle : needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const result = await runRegexWorker({ kind: 'replace', input, pattern, flags: options.caseSensitive ? '' : 'i', replacement: String(options.replacement ?? '') })
      return `${result.output ?? input}\n\n${result.matches?.length ?? 0} match(es) replaced.`
    }
    case 'slug-generator': return input.split(/\r?\n/).map((line) => slugify(line, options.separator === '_' ? '_' : '-').slice(0, Number(options.maxLength) || 120)).join('\n')
    case 'markdown-preview': {
      const marked = await import('marked')
      const purifier = (await import('dompurify')).default
      const html = await marked.marked(input, { gfm: true, breaks: true })
      return purifier.sanitize(html, { USE_PROFILES: { html: true } })
    }
    case 'html-formatter':
    case 'xml-formatter': {
      const parsed = new DOMParser().parseFromString(input, slug === 'xml-formatter' ? 'application/xml' : 'text/html')
      if (slug === 'xml-formatter' && parsed.querySelector('parsererror')) throw new Error('The XML could not be parsed. Check that tags are balanced and properly nested.')
      const serialized = new XMLSerializer().serializeToString(parsed)
      if (mode === 'minify') return serialized.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim()
      return serialized.replace(/>\s*</g, '>\n<').split('\n').map((line, index) => `${'  '.repeat(Math.max(0, (line.match(/^<\//) ? index - 1 : index) % 5))}${line}`).join('\n')
    }
    case 'css-minifier': return input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').replace(/;}/g, '}').trim()
    case 'css-beautifier': return input.replace(/\s*{\s*/g, ' {\n  ').replace(/\s*;\s*/g, ';\n  ').replace(/\s*}\s*/g, '\n}\n').replace(/,\s*/g, ',\n').replace(/\n\x20{2}\n/g, '\n\n').trim()
    case 'js-minifier': return minifyJsComments(input)
    case 'html-entities':
      if (mode === 'decode') {
        const textarea = document.createElement('textarea')
        textarea.innerHTML = input
        return textarea.value
      }
      return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    case 'meta-tag-generator': {
      const title = String(options.title ?? 'Page title')
      const description = String(options.description ?? input ?? 'Page description')
      const url = String(options.url ?? 'https://example.com')
      const image = String(options.image ?? '')
      return `<title>${escHtml(title)}</title>\n<meta name="description" content="${escHtml(description)}">\n<link rel="canonical" href="${escHtml(url)}">\n<meta property="og:title" content="${escHtml(title)}">\n<meta property="og:description" content="${escHtml(description)}">\n<meta property="og:url" content="${escHtml(url)}">${image ? `\n<meta property="og:image" content="${escHtml(image)}">` : ''}\n<meta name="twitter:card" content="summary_large_image">`
    }
    case 'robots-txt':
      if (mode === 'block-all') return 'User-agent: *\nDisallow: /'
      if (mode === 'block-ai') return 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: *\nAllow: /'
      return `User-agent: *\n${mode === 'allow-all' ? 'Allow: /' : `Disallow: ${input || '/private/'}`}${options.sitemap ? `\n\nSitemap: ${String(options.sitemap)}` : ''}`
    case 'qr-code': {
      if (!input.trim()) throw new Error('Enter text or a URL to make a QR code.')
      const qrcode = await import('qrcode')
      return await qrcode.toDataURL(input, { width: Number(options.size) || 280, margin: 2, errorCorrectionLevel: 'M', color: { dark: String(options.foreground || '#17151d'), light: String(options.background || '#ffffff') } })
    }
    case 'color-toolkit':
    case 'color-converter': {
      const hex = rgbHex(input)
      const [r, g, b] = parseHex(hex)
      const [rn, gn, bn] = [r, g, b].map((x) => x / 255)
      const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), delta = max - min
      const l = (max + min) / 2
      const v = max
      let h = 0
      if (delta) h = max === rn ? ((gn - bn) / delta) % 6 : max === gn ? (bn - rn) / delta + 2 : (rn - gn) / delta + 4
      h = Math.round(h * 60 + 360) % 360
      const s = delta ? Math.round(delta / (1 - Math.abs(2 * l - 1)) * 100) : 0
      const hsvS = max ? Math.round(delta / max * 100) : 0
      const k = 1 - max
      const cmyk = k === 1 ? [0, 0, 0, 100] : [(1 - rn - k) / (1 - k), (1 - gn - k) / (1 - k), (1 - bn - k) / (1 - k), k].map((part) => Math.round(part * 100))
      const ratio = (a: string, b: string) => { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return ((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2) }
      const background = String(options.background || '#FFFFFF')
      const foreground = String(options.foreground || hex)
      const contrast = (Number(ratio(foreground, background))).toFixed(2)
      const suggestion = luminance(background) > 0.179 ? '#000000' : '#FFFFFF'
      const suggestionRatio = ratio(suggestion, background)
      const suggestedText = Number(suggestionRatio) >= 4.5 ? `Suggested AA text color: ${suggestion} (${suggestionRatio}:1)` : `Neither black nor white reaches AA on ${background}.`
      return `HEX: ${hex}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${h}, ${s}%, ${Math.round(l * 100)}%)\nHSV: hsv(${h}, ${hsvS}%, ${Math.round(v * 100)}%)\nCMYK: ${cmyk.join('%, ')}%\n\nHarmonies (approximate):\nComplementary: hsl(${(h + 180) % 360}, ${s}%, ${Math.round(l * 100)}%)\nAnalogous: hsl(${(h + 30) % 360}, ${s}%, ${Math.round(l * 100)}%)\nTriadic: hsl(${(h + 120) % 360}, ${s}%, ${Math.round(l * 100)}%)\n\nContrast on white: ${ratio(hex, '#FFFFFF')}:1\nContrast on black: ${ratio(hex, '#000000')}:1\nText contrast (${foreground} on ${background}): ${contrast}:1\n${suggestedText}`
    }
    case 'gradient-generator': {
      const colors = (input.match(/#[\da-f]{3,8}\b/gi) ?? ['#8B5CF6', '#EC4899']).slice(0, 6)
      return `background: linear-gradient(${numberOption(options, 'angle', 135)}deg, ${colors.join(', ')});`
    }
    case 'box-shadow': return `box-shadow: ${numberOption(options, 'x', 0)}px ${numberOption(options, 'y', 12)}px ${numberOption(options, 'blur', 32)}px ${numberOption(options, 'spread', 0)}px ${String(options.color || 'rgba(0,0,0,.25)')};`
    case 'border-radius': return `border-radius: ${numberOption(options, 'radius', 12)}px;`
    case 'flexbox-playground': return `.container {\n  display: flex;\n  flex-direction: ${mode || 'row'};\n  justify-content: ${String(options.justify || 'space-between')};\n  align-items: ${String(options.align || 'center')};\n  gap: ${numberOption(options, 'gap', 12)}px;\n}`
    case 'grid-generator': return `.container {\n  display: grid;\n  grid-template-columns: repeat(${Math.min(12, Math.max(1, Number(options.columns) || 3))}, minmax(0, 1fr));\n  gap: ${numberOption(options, 'gap', 16)}px;\n}`
    case 'contrast-checker': {
      const foreground = rgbHex(String(options.foreground ?? '#F4F4F5'))
      const background = rgbHex(String(options.background ?? '#09090B'))
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
      const contrast = (values[0] + 0.05) / (values[1] + 0.05)
      return `Contrast ratio: ${contrast.toFixed(2)}:1\nWCAG AA normal text (4.5:1): ${contrast >= 4.5 ? 'PASS' : 'Does not pass'}\nWCAG AA large text (3:1): ${contrast >= 3 ? 'PASS' : 'Does not pass'}\nWCAG AAA normal text (7:1): ${contrast >= 7 ? 'PASS' : 'Does not pass'}\n\nForeground ${foreground} on background ${background}`
    }
    case 'css-unit-converter': {
      const value = Number(input)
      if (!Number.isFinite(value)) throw new Error('Enter a numeric CSS length in pixels.')
      const root = Number(options.root) || 16
      return `${value}px = ${(value / root).toFixed(4)}rem = ${(value / root).toFixed(4)}em = ${(value * 0.75).toFixed(3)}pt\nAssumption: root font size is ${root}px.`
    }
    case 'password-generator': {
      const length = Math.min(128, Math.max(4, Number(options.length) || 20))
      const count = Math.min(20, Math.max(1, Number(options.count) || 1))
      const clean = (value: string) => options.ambiguous ? value.replace(/[0O1lI]/g, '') : value
      const groups = [
        options.lower !== false ? clean('abcdefghijklmnopqrstuvwxyz') : '',
        options.upper !== false ? clean('ABCDEFGHIJKLMNOPQRSTUVWXYZ') : '',
        options.numbers !== false ? clean('0123456789') : '',
        options.symbols ? clean('!@#$%^&*()-_=+[]{};:,.?') : '',
      ].filter(Boolean)
      const chars = groups.join('')
      if (!chars) throw new Error('Select at least one character group.')
      const passwords = Array.from({ length: count }, () => {
        const result = groups.map((set) => set[secureInt(set.length)])
        while (result.length < length) result.push(chars[secureInt(chars.length)])
        return shuffle(result).join('')
      })
      const entropy = Math.round(length * Math.log2(chars.length))
      return `${passwords.join('\n')}\n\nLength: ${length} characters each\nEstimated entropy: ${entropy} bits per password\nGenerated locally; this value is not stored.`
    }
    case 'passphrase-generator': {
      const count = Math.min(10, Math.max(3, Number(options.count) || 5))
      const separator = String(options.separator ?? '-')
      const phrase = Array.from({ length: count }, () => simpleWords[secureInt(simpleWords.length)])
      let result = phrase.join(separator)
      if (options.capitalize) result = result.replace(/(^|[-_ ])\w/g, (c) => c.toUpperCase())
      if (options.number) result += separator + secureInt(100).toString().padStart(2, '0')
      return `${result}\n\n${count} words from an embedded ${simpleWords.length}-word list. Word-choice entropy estimate: ${(count * Math.log2(simpleWords.length)).toFixed(1)} bits.`
    }
    case 'uuid-generator': {
      const count = Math.min(1000, Math.max(1, Number(options.count) || 5))
      return Array.from({ length: count }, () => crypto.randomUUID()).map((uuid) => {
        let value = options.uppercase ? uuid.toUpperCase() : uuid
        if (options.noHyphens) value = value.replace(/-/g, '')
        if (options.braces) value = `{${value}}`
        return value
      }).join('\n')
    }
    case 'random-dice': {
      const count = Math.min(20, Math.max(1, Number(options.count) || 1))
      if (mode === 'coin') return Array.from({ length: count }, (_, i) => `${i + 1}. ${secureInt(2) ? 'Heads' : 'Tails'}`).join('\n')
      const sides = Math.max(2, Number(options.sides) || 6)
      if (mode === 'number') {
        const min = Math.ceil(numberOption(options, 'min', 1)), max = Math.floor(numberOption(options, 'max', 100))
        if (max < min) throw new Error('Maximum must be greater than or equal to minimum.')
        return Array.from({ length: count }, () => min + secureInt(max - min + 1)).join('\n')
      }
      const rolls = Array.from({ length: count }, () => 1 + secureInt(sides))
      return `${rolls.join(' + ')} = ${rolls.reduce((a, b) => a + b, 0)}`
    }
    case 'random-picker': {
      const entries = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      if (!entries.length) throw new Error('Add at least one item, one per line.')
      const mixed = shuffle(entries)
      if (mode === 'teams') {
        const teamCount = Math.min(entries.length, Math.max(2, Number(options.teams) || 2))
        const teams = Array.from({ length: teamCount }, () => [] as string[])
        mixed.forEach((name, index) => teams[index % teamCount].push(name))
        return teams.map((team, index) => `Team ${index + 1}\n${team.map((name) => `• ${name}`).join('\n')}`).join('\n\n')
      }
      const winners = Math.min(entries.length, Math.max(1, Number(options.count) || 1))
      return mixed.slice(0, winners).map((name, index) => `${index + 1}. ${name}`).join('\n')
    }
    case 'hash-generator': {
      const algorithm = String(options.algorithm || 'SHA-256')
      const digest = await crypto.subtle.digest(algorithm, bytes(input))
      const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
      return `${algorithm}\nHEX: ${options.uppercase ? hex.toUpperCase() : hex}\nBase64: ${btoa(String.fromCharCode(...new Uint8Array(digest)))}\n\nSHA-1 is not suitable for password storage. Use a password hashing scheme designed for that purpose.`
    }
    case 'username-generator': return Array.from({ length: Math.min(50, Math.max(1, Number(options.count) || 10)) }, () => `${adjectives[secureInt(adjectives.length)]}${options.separator === '-' ? '-' : ''}${nouns[secureInt(nouns.length)]}${options.numbers ? secureInt(1000) : ''}`.toLowerCase()).join('\n')
    case 'unit-converter': {
      const value = Number(input)
      if (!Number.isFinite(value)) throw new Error('Enter a number to convert.')
      const category = String(options.category || 'length')
      const tables: Record<string, Record<string, number>> = {
        length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254 },
        mass: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.0283495 },
        time: { s: 1, min: 60, h: 3600, day: 86400 },
        data: { B: 1, KB: 1000, MB: 1e6, GB: 1e9, KiB: 1024, MiB: 1048576, GiB: 1073741824 },
        speed: { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704 },
        volume: { L: 1, mL: 0.001, 'm³': 1000, gal: 3.78541 },
        area: { 'm²': 1, 'km²': 1e6, 'ft²': 0.092903, acre: 4046.86 },
      }
      if (category === 'temperature') {
        const from = String(options.from || 'C'), to = String(options.to || 'F')
        const c = from === 'F' ? (value - 32) * 5 / 9 : from === 'K' ? value - 273.15 : value
        const result = to === 'F' ? c * 9 / 5 + 32 : to === 'K' ? c + 273.15 : c
        return `${value} °${from} = ${result.toFixed(4)} °${to}`
      }
      const units = tables[category] ?? tables.length
      const from = String(options.from || Object.keys(units)[0]), to = String(options.to || Object.keys(units)[1])
      if (!(from in units) || !(to in units)) throw new Error('Choose supported units for the selected category.')
      return `${value} ${from} = ${(value * units[from] / units[to]).toPrecision(7).replace(/\.?0+$/, '')} ${to}`
    }
    case 'number-base': {
      const from = Math.min(36, Math.max(2, Number(options.from) || 10)), to = Math.min(36, Math.max(2, Number(options.to) || 16))
      const raw = input.trim().toLowerCase()
      const negative = raw.startsWith('-')
      const digits = negative ? raw.slice(1) : raw
      const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
      if (!digits || [...digits].some((char) => alphabet.indexOf(char) < 0 || alphabet.indexOf(char) >= from)) throw new Error(`Enter a whole number in base ${from}.`)
      let value = 0n
      for (const char of digits) value = value * BigInt(from) + BigInt(alphabet.indexOf(char))
      return `${negative ? '-' : ''}${value.toString(to).toUpperCase()}`
    }
    case 'percentage-calculator': {
      const [a, b] = input.split(/[,\s]+/).map(Number)
      if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Enter two numbers separated by a comma, for example: 15, 240.')
      if (mode === 'what-percent') return b === 0 ? 'Cannot divide by zero.' : `${a} is ${(a / b * 100).toFixed(2)}% of ${b}.`
      if (mode === 'change') return a === 0 ? 'Percentage change from zero is undefined.' : `Change: ${(((b - a) / Math.abs(a)) * 100).toFixed(2)}%`
      if (mode === 'increase') return `${b} increased by ${a}% = ${(b * (1 + a / 100)).toFixed(4)}`
      if (mode === 'decrease') return `${b} decreased by ${a}% = ${(b * (1 - a / 100)).toFixed(4)}`
      if (mode === 'reverse') return b === -100 ? 'Cannot reverse a 100% decrease (division by zero).' : `Original value before ${b}% change: ${(a / (1 + b / 100)).toFixed(4)}`
      return `${a}% of ${b} = ${(a / 100 * b).toFixed(4)}`
    }
    case 'aspect-ratio': {
      const [width, height] = input.split(/[,\s×x]+/).map(Number)
      if (!width || !height || !Number.isFinite(width) || !Number.isFinite(height)) throw new Error('Enter width and height, for example: 1920 × 1080.')
      const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a
      const factor = gcd(Math.round(width), Math.round(height))
      const targetWidth = Number(options.targetWidth)
      return `Ratio: ${Math.round(width) / factor}:${Math.round(height) / factor}\nDimensions: ${width} × ${height}\nMegapixels: ${(width * height / 1_000_000).toFixed(2)}${targetWidth ? `\nScaled dimensions: ${targetWidth} × ${(targetWidth * height / width).toFixed(0)}` : ''}`
    }
    case 'fps-frame-time': {
      if (mode === 'improvement') {
        const [before, after] = input.split(/[,\s]+/).map(Number)
        if (!Number.isFinite(before) || !Number.isFinite(after) || before <= 0) throw new Error('Enter two positive FPS values, for example: 60, 120.')
        return `FPS improvement: ${(((after - before) / before) * 100).toFixed(2)}%\nFrame time: ${(1000 / before).toFixed(3)} ms → ${(1000 / after).toFixed(3)} ms`
      }
      const fps = Number(input)
      if (!Number.isFinite(fps) || fps <= 0) throw new Error('Enter an FPS value greater than zero.')
      return `${fps} FPS = ${(1000 / fps).toFixed(3)} ms per frame\n\nReference rates:\n${[30, 60, 120, 144, 165, 240, 360].map((rate) => `${rate} FPS: ${(1000 / rate).toFixed(2)} ms`).join('\n')}`
    }
    default: return `${input}\n\n${sizeLabel(input)}`
  }
}

export const toolExamples: Record<string, string> = {
  'json-formatter': '{"name":"DARK DEVTOOLS","fast":true,"features":["private","free"]}',
  'json-csv': '[{"name":"Ada","role":"Engineer"},{"name":"Grace","role":"Compiler pioneer"}]',
  'json-yaml': '{"site":"DARK DEVTOOLS","features":["free","private"]}',
  base64: 'Hello, world! 👋',
  'url-encoder': 'https://example.com/search?q=dark tools&lang=en',
  'timestamp-converter': '1735689600',
  'regex-tester': 'Order #1234 is ready. Order #5678 is next.',
  'text-diff': 'The quick brown fox\njumps over the lazy dog.',
  'jwt-decoder': 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJkZW1vIiwiaWF0IjoxNzAwMDAwMDAwfQ.',
  'http-status': '404',
  'cron-explainer': '*/15 9-17 * * 1-5',
  'word-counter': 'A clear sentence makes a better tool. A better tool saves time.',
  'case-converter': 'DARK DevTools makes digital work easier',
  'lorem-ipsum': '3',
  'duplicate-lines': 'pear\napple\npear\nbanana',
  'find-replace': 'The quick brown fox jumps over the lazy dog.',
  'slug-generator': 'A practical guide to web tools',
  'markdown-preview': '# Hello, Markdown!\n\nWrite **bold text**, add a [link](https://example.com), or make a list:\n\n- Private by default\n- Easy to use',
  'html-formatter': '<main><h1>Hello</h1><p>A tidy snippet.</p></main>',
  'css-minifier': '/* card */\n.card {\n  color: #fff;\n  padding: 16px;\n}',
  'css-beautifier': '.card{color:#fff;padding:16px}.card:hover{opacity:.9}',
  'js-minifier': 'function greet(name) {\n  // Say hello\n  return "Hello, " + name;\n}',
  'xml-formatter': '<?xml version="1.0"?><root><item id="1">Hello</item></root>',
  'html-entities': '<h1>Keep & share</h1>',
  'meta-tag-generator': 'A fast and private browser toolkit',
  'robots-txt': '/private/',
  'qr-code': 'https://example.com',
  'color-toolkit': '#8B5CF6',
  'color-converter': '#A78BFA',
  'gradient-generator': '#8B5CF6, #EC4899',
  'contrast-checker': '',
  'css-unit-converter': '24',
  'password-generator': '',
  'passphrase-generator': '',
  'uuid-generator': '',
  'random-dice': '',
  'random-picker': 'Ada\nGrace\nKatherine\nMargaret',
  'hash-generator': 'DARK DEVTOOLS',
  'username-generator': '',
  'unit-converter': '12',
  'number-base': '255',
  'percentage-calculator': '15, 240',
  'aspect-ratio': '1920 × 1080',
  'fps-frame-time': '60',
}
