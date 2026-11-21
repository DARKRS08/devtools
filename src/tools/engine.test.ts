import { describe, expect, it } from 'vitest'
import { runTool } from './engine'

describe('tool logic', () => {
  it('formats and minifies valid JSON', async () => {
    expect(await runTool('json-formatter', '{"a":1,"b":2}', { indent: '2' })).toContain('\n  "a": 1')
    expect(await runTool('json-formatter', '{"b":2,"a":1}', { mode: 'minify', sort: true })).toBe('{"a":1,"b":2}')
    await expect(runTool('json-formatter', '{bad')).rejects.toThrow()
  })

  it('round-trips Unicode Base64', async () => {
    const encoded = await runTool('base64', 'Hello 👋')
    expect(await runTool('base64', encoded, { mode: 'decode' })).toBe('Hello 👋')
  })

  it('handles quoted commas and newlines in CSV', async () => {
    const csv = await runTool('json-csv', '[{"name":"Ada, Lovelace","note":"hello\\nworld"}]')
    expect(csv).toContain('"Ada, Lovelace"')
    expect(await runTool('json-csv', csv, { mode: 'csv-json' })).toContain('Ada, Lovelace')
    expect(await runTool('json-csv', csv, { mode: 'csv-json' })).toContain('hello\\nworld')
  })

  it('converts units and large integer bases accurately', async () => {
    expect(await runTool('unit-converter', '1000', { category: 'length', from: 'm', to: 'km' })).toContain('1 km')
    expect(await runTool('number-base', '900719925474099312345', { from: 10, to: 16 })).toBe(BigInt('900719925474099312345').toString(16).toUpperCase())
    await expect(runTool('number-base', '102', { from: 2, to: 10 })).rejects.toThrow(/base 2/)
  })

  it('calculates common percentage and aspect ratio values', async () => {
    expect(await runTool('percentage-calculator', '15, 240')).toContain('36')
    expect(await runTool('percentage-calculator', '10, 100', { mode: 'increase' })).toContain('110')
    expect(await runTool('percentage-calculator', '120, 20', { mode: 'reverse' })).toContain('100')
    expect(await runTool('aspect-ratio', '1920 x 1080')).toContain('16:9')
    expect(await runTool('fps-frame-time', '60')).toContain('16.667 ms')
    expect(await runTool('fps-frame-time', '60, 120', { mode: 'improvement' })).toContain('100.00%')
  })

  it('creates valid-size passwords and readable slugs', async () => {
    const password = await runTool('password-generator', '', { length: 32, count: 2, symbols: true, lower: true, upper: true, numbers: true, ambiguous: true })
    const value = password.split('\n')[0]
    expect(value).toHaveLength(32)
    expect(value).toMatch(/[a-z]/)
    expect(value).toMatch(/[A-Z]/)
    expect(value).toMatch(/\d/)
    expect(password.split('\n')[1]).toHaveLength(32)
    expect(password.split('\n').slice(0, 2).join('')).not.toMatch(/[0O1lI]/)
    expect(await runTool('slug-generator', 'Crème brûlée & café')).toBe('creme-brulee-and-cafe')
  })

  it('counts words and preserves strings while stripping JavaScript comments', async () => {
    const counts = await runTool('word-counter', 'Hello world 👋')
    expect(counts).toContain('Words: 2')
    const minified = await runTool('js-minifier', 'const x = "https://example.com"; // keep URL\nconsole.log(x)')
    expect(minified).toContain('"https://example.com"')
    expect(minified).not.toContain('keep URL')
  })

  it('converts supported color formats and validates cron fields', async () => {
    expect(await runTool('color-converter', 'hsl(120, 100%, 50%)')).toContain('HEX: #00FF00')
    expect(await runTool('color-converter', '#F008')).toContain('HEX: #FF0000')
    expect(await runTool('cron-explainer', '*/15 9-17 * * 1-5')).toContain('Next 5 runs')
    await expect(runTool('cron-explainer', '99 * * * *')).rejects.toThrow(/outside the range/)
  })
})
