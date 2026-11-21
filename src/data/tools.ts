import type { CategoryId } from './categories'

export type Tool = {
  id: string
  slug: string
  name: string
  category: CategoryId
  description: string
  longDescription: string
  keywords: string[]
  icon: string
  featured?: boolean
  popular?: boolean
  related: string[]
  howTo: string[]
  example?: string
}

type Seed = [slug: string, name: string, category: CategoryId, description: string, icon: string, keywords?: string[]]

const seeds: Seed[] = [
  ['html-playground', 'HTML Playground', 'developer', 'Write HTML, CSS and JavaScript and preview the result safely.', 'PanelsTopLeft', ['preview', 'sandbox']],
  ['json-formatter', 'JSON Formatter', 'developer', 'Format, validate and minify JSON with clear error details.', 'Braces', ['json', 'pretty print', 'minify'],],
  ['json-csv', 'JSON ↔ CSV', 'developer', 'Convert arrays of JSON objects to CSV and back.', 'Rows3', ['spreadsheet', 'comma separated']],
  ['json-yaml', 'JSON ↔ YAML', 'developer', 'Move data between JSON and YAML formats.', 'FileCode2', ['configuration']],
  ['base64', 'Base64 Encoder / Decoder', 'developer', 'Encode or decode text, including Unicode, locally.', 'Binary', ['base 64', 'unicode']],
  ['url-encoder', 'URL Encoder / Decoder', 'developer', 'Encode, decode and inspect URL components.', 'Link2', ['uri', 'percent encode']],
  ['timestamp-converter', 'Timestamp Converter', 'developer', 'Convert Unix timestamps and readable dates.', 'Clock3', ['unix', 'epoch', 'date']],
  ['regex-tester', 'Regex Tester', 'developer', 'Try regular expressions and inspect matches and groups.', 'Regex', ['pattern', 'expression']],
  ['text-diff', 'Text Diff', 'developer', 'Compare two pieces of text and see what changed.', 'GitCompareArrows', ['compare', 'changes']],
  ['jwt-decoder', 'JWT Decoder', 'developer', 'Read a JWT header and payload locally. Signatures are not verified.', 'KeyRound', ['token', 'json web token']],
  ['http-status', 'HTTP Status Codes', 'developer', 'Search HTTP response codes and plain-language meanings.', 'RadioTower', ['http', 'reference']],
  ['cron-explainer', 'Cron Explainer', 'developer', 'Understand common five-field cron schedules.', 'CalendarClock', ['schedule', 'expression']],
  ['word-counter', 'Word & Character Counter', 'text', 'Count words, characters, lines and estimated reading time.', 'TextCursorInput', ['writing', 'sentence']],
  ['case-converter', 'Text Case Converter', 'text', 'Switch text between nine practical capitalization styles.', 'CaseSensitive', ['uppercase', 'camelcase', 'snake case']],
  ['lorem-ipsum', 'Lorem Ipsum Generator', 'text', 'Generate placeholder paragraphs, sentences or words.', 'Text', ['placeholder', 'dummy text']],
  ['duplicate-lines', 'Duplicate Lines & Sorter', 'text', 'Remove repeated lines, sort, reverse or shuffle a list.', 'ListFilter', ['dedupe', 'sort']],
  ['find-replace', 'Find & Replace', 'text', 'Replace matching text, with optional case and regex controls.', 'Replace', ['search', 'regex']],
  ['slug-generator', 'Slug Generator', 'text', 'Turn titles into readable URL slugs.', 'Link', ['url', 'permalink']],
  ['markdown-preview', 'Markdown Previewer', 'text', 'Write Markdown and preview a sanitized rendered version.', 'FileText', ['md', 'preview']],
  ['html-formatter', 'HTML Formatter / Minifier', 'web', 'Tidy or compact HTML with a lightweight formatter.', 'CodeXml', ['markup']],
  ['css-minifier', 'CSS Minifier', 'web', 'Reduce CSS whitespace and comments for smaller snippets.', 'Minimize2', ['stylesheet', 'compress']],
  ['css-beautifier', 'CSS Beautifier', 'web', 'Format CSS rules into a readable, indented layout.', 'Paintbrush', ['stylesheet', 'pretty print']],
  ['js-minifier', 'JavaScript Minifier', 'web', 'Compact basic JavaScript whitespace and comments without renaming.', 'FileJson2', ['javascript', 'compress']],
  ['xml-formatter', 'XML Formatter', 'web', 'Validate and format XML with browser-native parsing.', 'FileCode', ['markup']],
  ['html-entities', 'HTML Entity Encoder', 'web', 'Encode special characters or decode HTML entities safely.', 'Code', ['escape', 'unescape']],
  ['meta-tag-generator', 'Meta Tag Generator', 'web', 'Build a shareable set of HTML metadata tags.', 'Tags', ['seo', 'open graph']],
  ['robots-txt', 'robots.txt Generator', 'web', 'Compose crawler rules. robots.txt is not an access-control tool.', 'Bot', ['crawler', 'seo']],
  ['qr-code', 'QR Code Generator', 'web', 'Create and download a QR code for text or a URL.', 'QrCode', ['barcode']],
  ['image-base64', 'Image to Base64', 'web', 'Convert an image file to a data URI on your device.', 'Image', ['data uri', 'file']],
  ['color-toolkit', 'Color Toolkit', 'color', 'Explore color values, harmonies and reusable CSS variables.', 'Palette', ['hex', 'rgb', 'hsl']],
  ['color-converter', 'HEX / RGB / HSL Converter', 'color', 'Convert common color notations and preview the result.', 'Pipette', ['hex', 'rgb', 'hsl']],
  ['gradient-generator', 'CSS Gradient Generator', 'color', 'Compose a gradient and copy its CSS declaration.', 'Blend', ['linear gradient']],
  ['box-shadow', 'CSS Box Shadow Generator', 'color', 'Adjust a box shadow visually and copy the CSS.', 'SquareDashed', ['shadow']],
  ['border-radius', 'CSS Border Radius Generator', 'color', 'Tune corner radii and preview the resulting shape.', 'Scan', ['rounded corners']],
  ['flexbox-playground', 'Flexbox Playground', 'color', 'Explore common Flexbox settings and copy a starter snippet.', 'LayoutPanelTop', ['flex']],
  ['grid-generator', 'CSS Grid Generator', 'color', 'Create a simple responsive CSS grid declaration.', 'Grid2X2', ['grid']],
  ['contrast-checker', 'Contrast Checker', 'color', 'Check text contrast against WCAG contrast thresholds.', 'Contrast', ['accessibility', 'wcag']],
  ['css-unit-converter', 'CSS Unit Converter', 'color', 'Convert CSS lengths using your chosen reference sizes.', 'Ruler', ['px', 'rem', 'viewport']],
  ['password-generator', 'Password Generator', 'generators', 'Generate strong random passwords using browser cryptography.', 'Key', ['secure', 'random'],],
  ['passphrase-generator', 'Passphrase Generator', 'generators', 'Make a memorable multiword passphrase locally.', 'TextQuote', ['password', 'words']],
  ['uuid-generator', 'UUID Generator', 'generators', 'Generate random UUID v4 identifiers in batches.', 'Fingerprint', ['guid', 'identifier']],
  ['random-dice', 'Random Number / Dice / Coin', 'generators', 'Roll virtual dice, flip a coin or choose random numbers.', 'Dices', ['random', 'roll']],
  ['random-picker', 'Random Picker & Teams', 'generators', 'Pick winners or split a list into balanced teams.', 'Shuffle', ['raffle', 'team']],
  ['hash-generator', 'Hash Generator', 'generators', 'Calculate SHA digests in your browser for text or a file.', 'Hash', ['sha256', 'checksum']],
  ['username-generator', 'Username Generator', 'generators', 'Create playful username ideas without checking availability.', 'AtSign', ['handle', 'name']],
  ['unit-converter', 'Unit Converter', 'converters', 'Convert common length, mass, temperature, volume and data units.', 'ArrowLeftRight', ['measurement']],
  ['number-base', 'Number Base Converter', 'converters', 'Convert whole numbers between bases 2 and 36.', 'Binary', ['radix', 'hexadecimal']],
  ['percentage-calculator', 'Percentage Calculator', 'converters', 'Solve five common percentage questions with working shown.', 'Percent', ['math']],
  ['aspect-ratio', 'Aspect Ratio Calculator', 'converters', 'Scale image and video dimensions while preserving proportions.', 'Frame', ['resolution', 'ratio']],
  ['fps-frame-time', 'FPS & Frame-Time Calculator', 'converters', 'Convert frames per second to frame time and compare rates.', 'Gauge', ['refresh rate', 'milliseconds']],
]

const categoryRelated = (category: CategoryId) =>
  seeds.filter((seed) => seed[2] === category).slice(0, 3).map((seed) => seed[0])

export const tools: Tool[] = seeds.map(([slug, name, category, description, icon, keywords = []]) => ({
  id: slug,
  slug,
  name,
  category,
  description,
  longDescription: `${description} DARK DEVTOOLS runs this utility in your browser, so the value you enter stays on this device. Results are designed to be easy to copy, understand and reuse. For specialized workflows, always verify generated output against the requirements of your project.`,
  keywords: [...keywords, name.toLowerCase(), category],
  icon,
  featured: ['json-formatter', 'password-generator', 'html-playground', 'color-toolkit', 'qr-code', 'markdown-preview'].includes(slug),
  popular: ['json-formatter', 'password-generator', 'base64', 'word-counter', 'color-toolkit', 'qr-code'].includes(slug),
  related: categoryRelated(category).filter((item) => item !== slug).slice(0, 3),
  howTo: [
    'Enter or choose the value you want to work with.',
    'Adjust any available options for your use case.',
    'Run the tool, review the result, then copy or download it.',
  ],
}))

export const getTool = (slug: string) => tools.find((tool) => tool.slug === slug)
export const getCategoryTools = (category: CategoryId) => tools.filter((tool) => tool.category === category)
