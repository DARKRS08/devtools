import type { Tool } from '../data/tools'

export function searchTools(query: string, tools: Tool[]) {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return tools
  const terms = normalized.split(/\s+/)
  const scored = tools.map((tool) => {
    const name = tool.name.toLocaleLowerCase()
    const keywords = tool.keywords.join(' ').toLocaleLowerCase()
    const description = tool.description.toLocaleLowerCase()
    const category = tool.category.toLocaleLowerCase()
    let score = 0
    for (const term of terms) {
      if (name === term) score += 100
      else if (name.startsWith(term)) score += 30
      else if (name.includes(term)) score += 20
      if (keywords.includes(term)) score += 10
      if (category.includes(term)) score += 5
      if (description.includes(term)) score += 2
    }
    return { tool, score }
  })
  return scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name)).map(({ tool }) => tool)
}
