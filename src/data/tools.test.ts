import { describe, expect, it } from 'vitest'
import { categories } from './categories'
import { tools } from './tools'

describe('tool registry', () => {
  it('contains 50 tools with unique identifiers and slugs', () => {
    expect(tools).toHaveLength(50)
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(50)
    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(50)
  })

  it('has complete content and valid related references for every tool', () => {
    const ids = new Set(tools.map((tool) => tool.id))
    for (const tool of tools) {
      expect(tool.name).toBeTruthy()
      expect(tool.description).toBeTruthy()
      expect(tool.longDescription).toBeTruthy()
      expect(tool.icon).toBeTruthy()
      expect(tool.howTo.length).toBeGreaterThanOrEqual(3)
      expect(categories.some((category) => category.id === tool.category)).toBe(true)
      expect(tool.related.every((id) => ids.has(id))).toBe(true)
    }
  })

  it('has the expected category distribution', () => {
    expect(categories.map(({ id }) => tools.filter((tool) => tool.category === id).length)).toEqual([12, 7, 10, 9, 7, 5])
  })
})
