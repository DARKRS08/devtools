type Request = { kind: 'test' | 'replace'; input: string; pattern: string; flags: string; replacement?: string }
type Response = { matches?: { text: string; index: number; captures?: string[]; groups?: Record<string, string> }[]; output?: string; error?: string }

self.onmessage = (event: MessageEvent<Request>) => {
  try {
    const { kind, input, pattern, flags, replacement = '' } = event.data
    const regex = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`)
    if (kind === 'replace') {
      const matches = [...input.matchAll(regex)]
      self.postMessage({ matches: matches.map((match) => ({ text: match[0], index: match.index ?? 0 })), output: input.replace(regex, replacement) } satisfies Response)
    } else {
      const matches = [...input.matchAll(regex)].map((match) => ({
        text: match[0],
        index: match.index ?? 0,
        captures: match.slice(1),
        groups: match.groups as Record<string, string> | undefined,
      }))
      self.postMessage({ matches } satisfies Response)
    }
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Invalid regular expression.' } satisfies Response)
  }
}

export {}
